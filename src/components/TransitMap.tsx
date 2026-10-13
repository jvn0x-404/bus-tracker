import { useEffect, useMemo, useState } from 'react';
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { isSupabaseConfigured } from '../lib/supabase';
import { loadMapSnapshot, subscribeToLocations } from '../lib/services';
import type { BusLocation, MapSnapshot } from '../lib/types';

const STALE_AFTER_MS = 30_000;
type TransitMapProps = { mode?: 'fleet' | 'student' | 'driver' };

function validPoint(latitude: number | null | undefined, longitude: number | null | undefined): latitude is number {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude as number) <= 90 && Math.abs(longitude as number) <= 180;
}

function freshness(location: BusLocation | undefined) {
  if (!location) return 'OFFLINE';
  return Date.now() - Date.parse(location.measured_at) <= STALE_AFTER_MS ? 'LIVE' : 'STALE';
}

function busIcon(state: string, selected: boolean) {
  return L.divIcon({ className: 'bus-marker', html: `<span class="bus-marker-dot ${state.toLowerCase()} ${selected ? 'selected' : ''}">●</span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
}

function stopIcon() {
  return L.divIcon({ className: 'stop-marker', html: '<span>●</span>', iconSize: [18, 18], iconAnchor: [9, 9] });
}

function MapController({ center, recenterKey }: { center: { lat: number; lng: number }; recenterKey: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, Math.max(map.getZoom(), 13), { animate: true }); }, [center.lat, center.lng, map, recenterKey]);
  return null;
}

export function TransitMap({ mode = 'fleet' }: TransitMapProps) {
  const [snapshot, setSnapshot] = useState<MapSnapshot | null>(null);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [recenterKey, setRecenterKey] = useState(0);
  const [error, setError] = useState('');

  async function refresh() {
    if (!isSupabaseConfigured) return;
    try { setError(''); setSnapshot(await loadMapSnapshot()); }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'Unable to load live fleet data.'); }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cleanup: (() => void) | undefined;
    void subscribeToLocations((location) => setSnapshot((current) => current ? ({ ...current, locations: [...current.locations.filter((item) => item.bus_id !== location.bus_id), location] }) : current))
      .then((remove) => { cleanup = remove; })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Live location subscription failed.'));
    return () => cleanup?.();
  }, []);

  const buses = useMemo(() => (snapshot?.buses ?? []).filter((bus) => {
    const trip = snapshot?.trips.find((item) => item.bus_id === bus.id);
    const route = snapshot?.routes.find((item) => item.id === trip?.route_id);
    return `${bus.bus_number} ${bus.registration_number ?? ''} ${route?.name ?? ''}`.toLowerCase().includes(query.toLowerCase());
  }), [query, snapshot]);
  const selectedBus = snapshot?.buses.find((bus) => bus.id === selectedBusId) ?? buses[0];
  const selectedTrip = snapshot?.trips.find((trip) => trip.bus_id === selectedBus?.id);
  const selectedLocation = snapshot?.locations.find((location) => location.bus_id === selectedBus?.id && validPoint(location.latitude, location.longitude));
  const selectedRoute = snapshot?.routes.find((route) => route.id === (selectedRouteId ?? selectedTrip?.route_id));
  const selectedRouteStops = (snapshot?.routeStops ?? []).filter((item) => item.route_id === selectedRoute?.id).sort((a, b) => (a.sequence_no ?? a.stop_order) - (b.sequence_no ?? b.stop_order));
  const validStops = selectedRouteStops.filter((item) => validPoint(item.stops?.latitude, item.stops?.longitude));
  const validLocations = (snapshot?.locations ?? []).filter((location) => validPoint(location.latitude, location.longitude));
  const firstStop = validStops.find((item) => item.stops && validPoint(item.stops.latitude, item.stops.longitude));
  const center = selectedLocation && validPoint(selectedLocation.latitude, selectedLocation.longitude)
    ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
    : firstStop?.stops ? { lat: firstStop.stops.latitude as number, lng: firstStop.stops.longitude as number }
      : validLocations[0] ? { lat: validLocations[0].latitude, lng: validLocations[0].longitude } : null;

  if (!isSupabaseConfigured) return <div className="map-state"><MapPin size={20}/><b>Supabase is not configured</b><span>Live bus locations require an authenticated Supabase client.</span></div>;
  if (error) return <div className="map-state"><b>Live map unavailable</b><span>{error}</span><button className="secondary" onClick={() => void refresh()}><RefreshCw size={14}/> Retry</button></div>;
  if (!snapshot) return <div className="map-state"><RefreshCw size={18} className="spin"/><span>Loading authorized fleet data…</span></div>;
  if (!center) return <div className="map-state"><MapPin size={20}/><b>No coordinate data available</b><span>There are no authorized bus locations or route stops to display yet.</span></div>;

  return <div className="transit-map-wrap">
    <div className="transit-map-toolbar"><label className="map-search">Search buses or routes<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="BUS-01 or North Campus"/></label><button className="secondary" onClick={() => void refresh()}><RefreshCw size={14}/> Refresh</button></div>
    <div className="transit-map-layout"><aside className="transit-map-list"><div className="map-list-title"><b>{mode === 'student' ? 'Your active trip' : 'Live fleet'}</b><span>{buses.length} buses</span></div>{buses.map((bus) => { const trip = snapshot.trips.find((item) => item.bus_id === bus.id); const location = snapshot.locations.find((item) => item.bus_id === bus.id); const state = freshness(location); return <button className={'map-bus-row '+(selectedBus?.id === bus.id ? 'selected' : '')} key={bus.id} onClick={() => { setSelectedBusId(bus.id); setSelectedRouteId(trip?.route_id ?? null); setRecenterKey((value) => value + 1); }}><span className={'map-state-dot '+state.toLowerCase()}/><span className="grow"><b>{bus.bus_number}</b><small>{snapshot.routes.find((route) => route.id === trip?.route_id)?.name ?? 'No route'} · {trip?.status ?? 'No active trip'}</small></span><em>{state}</em></button>; })}{!buses.length && <p className="map-empty">No buses match this search.</p>}</aside><div className="transit-map-canvas"><MapContainer center={center} zoom={13} scrollWheelZoom className="leaflet-map"><MapController center={center} recenterKey={recenterKey}/><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{validLocations.map((location) => { const bus = snapshot.buses.find((item) => item.id === location.bus_id); const state = freshness(location); const selected = selectedBus?.id === location.bus_id; return <Marker key={location.bus_id} position={[location.latitude, location.longitude]} icon={busIcon(state, selected)} eventHandlers={{ click: () => { setSelectedBusId(location.bus_id); const trip = snapshot.trips.find((item) => item.bus_id === location.bus_id); setSelectedRouteId(trip?.route_id ?? null); } }}><Popup><div className="map-info"><b>{bus?.bus_number ?? 'Bus'}</b><span>{snapshot.routes.find((route) => route.id === snapshot.trips.find((trip) => trip.bus_id === location.bus_id)?.route_id)?.name ?? 'Unassigned route'}</span><span className={state.toLowerCase()}>{state} · {new Date(location.measured_at).toLocaleTimeString()}</span></div></Popup></Marker>; })}{validStops.map((item) => <Marker key={item.stop_id} position={[item.stops!.latitude!, item.stops!.longitude!]} icon={stopIcon()}><Popup>{item.stops!.name}</Popup></Marker>)}{validStops.length > 1 && <Polyline positions={validStops.map((item) => [item.stops!.latitude!, item.stops!.longitude!] as [number, number])} pathOptions={{ color: '#2563eb', weight: 4, opacity: .9 }}/>}<>{selectedLocation && <CircleMarker center={[selectedLocation.latitude, selectedLocation.longitude]} radius={18} pathOptions={{ color: '#2563eb', fillOpacity: 0, weight: 2 }}/>}</></MapContainer><button className="map-recenter" onClick={() => setRecenterKey((value) => value + 1)} title="Recenter on selected bus"><LocateFixed size={16}/></button></div></div>
  </div>;
}
