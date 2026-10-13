import { useState } from 'react';
import { Pencil, Plus, Route as RouteIcon, Save, X } from 'lucide-react';

type RouteRecord = { name: string; code: string; origin: string; destination: string; stops: string; duration: string; assignedBus: string; status: string; originLat: string; originLng: string; destinationLat: string; destinationLng: string; coordinatePath?: Array<[number, number]> };

const starterRoutes: RouteRecord[] = [
  { name: 'North Campus', code: 'RT-001', origin: 'Maple Residency', destination: 'University Campus', stops: 'Maple Residency, Central Library, Tech Park Junction, Main Gate, University Campus', duration: '32 min', assignedBus: 'BUS-01', status: 'Active', originLat: '', originLng: '', destinationLat: '', destinationLng: '' },
  { name: 'East Connector', code: 'RT-002', origin: 'East Gate', destination: 'University Campus', stops: 'East Gate, Science Block, Library, Main Gate, University Campus', duration: '28 min', assignedBus: 'BUS-02', status: 'Active', originLat: '', originLng: '', destinationLat: '', destinationLng: '' },
  { name: 'Lakeview Loop', code: 'RT-003', origin: 'Lakeview Circle', destination: 'Lakeview Circle', stops: 'Lakeview Circle, Hostel Road, Sports Complex, Lakeview Circle', duration: '24 min', assignedBus: 'BUS-03', status: 'Active', originLat: '', originLng: '', destinationLat: '', destinationLng: '' },
  { name: 'South Express', code: 'RT-004', origin: 'South Market', destination: 'University Campus', stops: 'South Market, Bus Stand, Admin Block, University Campus', duration: '26 min', assignedBus: 'BUS-04', status: 'Paused', originLat: '', originLng: '', destinationLat: '', destinationLng: '' },
];

const blankRoute: RouteRecord = { name: '', code: '', origin: '', destination: '', stops: '', duration: '30 min', assignedBus: 'Unassigned', status: 'Active', originLat: '', originLng: '', destinationLat: '', destinationLng: '' };

function coordinatePath(route: RouteRecord) {
  const start = [Number(route.originLat), Number(route.originLng)] as [number, number];
  const end = [Number(route.destinationLat), Number(route.destinationLng)] as [number, number];
  const count = Math.max(route.stops.split(',').filter((stop) => stop.trim()).length, 2);
  return Array.from({ length: count }, (_, index) => { const ratio = index / (count - 1); return [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio] as [number, number]; });
}

export function RouteManagement({ search, notify }: { search: string; notify: (message: string) => void }) {
  const [routes, setRoutes] = useState<RouteRecord[]>(() => { try { return JSON.parse(localStorage.getItem('transitpulse-demo-routes') ?? 'null') ?? starterRoutes; } catch { return starterRoutes; } });
  const [editing, setEditing] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<RouteRecord>(blankRoute);
  const rows = routes.filter((route) => Object.values(route).join(' ').toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setForm(blankRoute); setFormOpen(true); }
  function openEdit(index: number) { setEditing(index); setForm(routes[index]); setFormOpen(true); }
  function closeForm() { setEditing(null); setFormOpen(false); }
  function saveRoute() {
    const coordinates = [form.originLat, form.originLng, form.destinationLat, form.destinationLng].map(Number);
    if (!form.name.trim() || !form.code.trim() || !form.origin.trim() || !form.destination.trim() || !form.stops.trim() || coordinates.some((value) => !Number.isFinite(value))) { notify('Route name, code, stops, and valid start/end coordinates are required'); return; }
    if (coordinates[0] < -90 || coordinates[0] > 90 || coordinates[2] < -90 || coordinates[2] > 90 || coordinates[1] < -180 || coordinates[1] > 180 || coordinates[3] < -180 || coordinates[3] > 180) { notify('Latitude must be between -90 and 90; longitude between -180 and 180'); return; }
    const normalized = { ...form, name: form.name.trim(), code: form.code.trim().toUpperCase(), origin: form.origin.trim(), destination: form.destination.trim(), stops: form.stops.trim(), coordinatePath: coordinatePath(form) };
    const next = [...routes];
    if (editing === null) next.push(normalized); else next[editing] = normalized;
    setRoutes(next); localStorage.setItem('transitpulse-demo-routes', JSON.stringify(next)); closeForm(); notify(editing === null ? 'Route added' : 'Route details updated');
  }

  return <><Header title="Routes & stops" desc="Add routes, define stop sequences, and keep campus journeys organized." action={<button className="primary" onClick={openAdd}><Plus size={15}/> Add route</button>}/><div className="stats"><Stat label="Total routes" value={String(routes.length)} note="Across campus" icon={RouteIcon} color="blue"/><Stat label="Active" value={String(routes.filter((route) => route.status === 'Active').length)} note="Currently running" icon={RouteIcon} color="green"/><Stat label="Stops mapped" value={String(routes.reduce((total, route) => total + route.stops.split(',').filter(Boolean).length, 0))} note="Configured sequence" icon={RouteIcon} color="purple"/><Stat label="Needs attention" value={String(routes.filter((route) => route.status !== 'Active').length).padStart(2, '0')} note="Review required" icon={RouteIcon} color="amber"/></div><section className="panel"><PanelHead title="Route directory" sub={`${rows.length} records`}/><div className="table-scroll"><table><thead><tr><th>Route</th><th>Code</th><th>Start</th><th>End</th><th>Stops</th><th>Duration</th><th>Bus</th><th>Status</th><th>Map</th><th/></tr></thead><tbody>{rows.map((route) => { const index = routes.indexOf(route); return <tr key={route.code}><td><div className="vehicle-name"><div className="route-icon"><RouteIcon/></div><b>{route.name}</b></div></td><td>{route.code}</td><td>{route.origin}</td><td>{route.destination}</td><td>{route.stops.split(',').filter(Boolean).length}</td><td>{route.duration}</td><td>{route.assignedBus}</td><td><Status text={route.status}/></td><td><span className={route.coordinatePath?.length ? 'route-map-ready' : 'route-map-missing'}>{route.coordinatePath?.length ? 'Ready' : 'Coordinates needed'}</span></td><td><button className="icon" onClick={() => openEdit(index)} aria-label={`Edit ${route.name}`}><Pencil size={15}/></button></td></tr>; })}</tbody></table>{!rows.length&&<p className="empty">No routes found. Add a route or try a different search.</p>}</div></section>{formOpen ? <RouteForm form={form} setForm={setForm} editing={editing} onClose={closeForm} onSave={saveRoute}/> : null}</>;
}

function RouteForm({ form, setForm, editing, onClose, onSave }: { form: RouteRecord; setForm: (value: RouteRecord) => void; editing: number | null; onClose: () => void; onSave: () => void }) {
  const update = (key: keyof RouteRecord, value: string) => setForm({ ...form, [key]: value });
  return <div className="overlay" onClick={onClose}><div className="modal bus-form" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><h3>{editing === null ? 'Add route' : 'Edit route details'}</h3><p>Required fields are marked with an asterisk. Coordinates create the map path automatically.</p></div><button className="icon" onClick={onClose} aria-label="Close route form"><X/></button></div><div className="bus-form-grid"><label>Route name *<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="North Campus"/></label><label>Route code *<input value={form.code} onChange={(event) => update('code', event.target.value)} placeholder="RT-005"/></label><label>Start stop *<input value={form.origin} onChange={(event) => update('origin', event.target.value)} placeholder="Maple Residency"/></label><label>End stop *<input value={form.destination} onChange={(event) => update('destination', event.target.value)} placeholder="University Campus"/></label><label className="bus-form-wide">Stop sequence *<input value={form.stops} onChange={(event) => update('stops', event.target.value)} placeholder="Stop 1, Stop 2, Stop 3"/><small className="form-hint">Enter stops in order, separated by commas.</small></label><label>Start latitude *<input type="number" step="any" value={form.originLat} onChange={(event) => update('originLat', event.target.value)} placeholder="12.9716"/></label><label>Start longitude *<input type="number" step="any" value={form.originLng} onChange={(event) => update('originLng', event.target.value)} placeholder="77.5946"/></label><label>End latitude *<input type="number" step="any" value={form.destinationLat} onChange={(event) => update('destinationLat', event.target.value)} placeholder="12.9816"/></label><label>End longitude *<input type="number" step="any" value={form.destinationLng} onChange={(event) => update('destinationLng', event.target.value)} placeholder="77.6046"/></label><label>Estimated duration<input value={form.duration} onChange={(event) => update('duration', event.target.value)} placeholder="30 min"/></label><label>Assigned bus<input value={form.assignedBus} onChange={(event) => update('assignedBus', event.target.value)} placeholder="BUS-08 or Unassigned"/></label><label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option>Active</option><option>Paused</option><option>Draft</option></select></label></div><button className="primary full" onClick={onSave}><Save size={15}/> Save route and create map path</button></div></div>;
}

function Header({ title, desc, action }: { title: string; desc: string; action?: any }) { return <div className="page-header"><div><div className="eyebrow">TRANSITPULSE / CAMPUS MOBILITY</div><h1>{title}</h1><p>{desc}</p></div>{action && <div className="head-action">{action}</div>}</div>; }
function PanelHead({ title, sub }: { title: string; sub: string }) { return <div className="panel-head"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
function Stat({ label, value, note, icon: Icon, color }: { label: string; value: string; note: string; icon: any; color: string }) { return <div className="stat"><div className="stat-top"><span>{label}</span><div className={'stat-icon '+color}><Icon/></div></div><strong>{value}</strong><small>{note}</small></div>; }
function Status({ text }: { text: string }) { return <span className={'status '+(text === 'Active' ? 'success' : 'offline')}><i/>{text}</span>; }
