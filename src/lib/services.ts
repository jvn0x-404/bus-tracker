import { requireSupabase, supabase } from './supabase';
import type { AppRole, Bus, BusLocation, MapSnapshot, Notification, Profile, Route, RouteStopRow, Trip } from './types';

export async function getSession() {
  return requireSupabase().auth.getSession();
}

export async function signIn(email: string, password: string) {
  return requireSupabase().auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return requireSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin, skipBrowserRedirect: true },
  });
}

export async function signUp(email: string, password: string, fullName: string) {
  return requireSupabase().auth.signUp({ email, password, options: { data: { full_name: fullName } } });
}

export async function signOut() {
  return requireSupabase().auth.signOut();
}

export async function getMyProfile() {
  const { data, error } = await requireSupabase().from('profiles').select('*').single<Profile>();
  return { data, error };
}

export async function getCurrentRole(): Promise<AppRole | null> {
  const { data, error } = await getMyProfile();
  if (error) throw error;
  return data?.is_active ? data.role : null;
}

export async function listBuses() {
  const { data, error } = await requireSupabase().from('buses').select('*').order('bus_number').returns<Bus[]>();
  if (error) throw error;
  return data;
}

export async function listTrips() {
  const { data, error } = await requireSupabase().from('trips').select('*').order('scheduled_start').returns<Trip[]>();
  if (error) throw error;
  return data;
}

export async function getMyActiveTrip() {
  const { data, error } = await requireSupabase().rpc('get_my_active_trip').maybeSingle<Trip>();
  if (error) throw error;
  return data;
}

export async function listNotifications() {
  const { data, error } = await requireSupabase().from('notifications').select('*').order('created_at', { ascending: false }).returns<Notification[]>();
  if (error) throw error;
  return data;
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await requireSupabase().rpc('mark_notification_read', { p_notification_id: notificationId });
  if (error) throw error;
}

export async function setWaiting(waiting: boolean) {
  const { error } = await requireSupabase().rpc('set_my_waiting', { p_waiting: waiting });
  if (error) throw error;
}

export async function subscribeToLocations(onChange: (location: BusLocation) => void) {
  const channel = supabase.channel(`transitpulse-locations-${crypto.randomUUID()}`).on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'bus_locations_current' },
    (payload) => onChange(payload.new as BusLocation),
  );
  await channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export async function recordDriverLocation(tripId: string, position: GeolocationPosition) {
  const { error } = await requireSupabase().rpc('update_bus_location', {
    p_trip_id: tripId,
    p_latitude: position.coords.latitude,
    p_longitude: position.coords.longitude,
    p_accuracy_m: position.coords.accuracy,
    p_speed_mps: position.coords.speed,
    p_heading_degrees: position.coords.heading,
    p_measured_at: new Date(position.timestamp).toISOString(),
  });
  if (error) throw error;
}

export async function loadMapSnapshot(): Promise<MapSnapshot> {
  const client = requireSupabase();
  const [tripResult, busResult, routeResult, routeStopResult, locationResult] = await Promise.all([
    client.from('trips').select('*').order('scheduled_start', { ascending: true }).limit(100).returns<Trip[]>(),
    client.from('buses').select('*').order('bus_number').returns<Bus[]>(),
    client.from('routes').select('id,name,route_code').eq('active', true).order('name').returns<Route[]>(),
    client.from('route_stops').select('route_id,stop_id,stop_order,sequence_no,stops(id,name,latitude,longitude)').eq('is_active', true).order('sequence_no').returns<RouteStopRow[]>(),
    client.from('bus_locations_current').select('*').returns<BusLocation[]>(),
  ]);
  const firstError = [tripResult, busResult, routeResult, routeStopResult, locationResult].find((result) => result.error)?.error;
  if (firstError) throw firstError;
  return {
    trips: tripResult.data ?? [],
    buses: busResult.data ?? [],
    routes: routeResult.data ?? [],
    routeStops: routeStopResult.data ?? [],
    locations: locationResult.data ?? [],
  };
}
