import { useState } from 'react';
import { Bus, Pencil, Plus, Save, X } from 'lucide-react';

type BusRecord = { busNumber: string; registration: string; capacity: string; route: string; status: string; driver: string; eta: string };

const starterBuses: BusRecord[] = [
  { busNumber: 'BUS-01', registration: 'KA 01 AB 1024', capacity: '40 seats', route: 'North Campus', status: 'On route', driver: 'Arjun Kumar', eta: '08 min' },
  { busNumber: 'BUS-02', registration: 'KA 01 CD 2048', capacity: '36 seats', route: 'East Connector', status: 'On route', driver: 'Priya Sharma', eta: '12 min' },
  { busNumber: 'BUS-03', registration: 'KA 01 EF 3072', capacity: '40 seats', route: 'Lakeview Loop', status: 'Delayed', driver: 'Rahul Das', eta: '18 min' },
  { busNumber: 'BUS-04', registration: 'KA 01 GH 4096', capacity: '32 seats', route: 'South Express', status: 'GPS offline', driver: 'Meera Nair', eta: '—' },
  { busNumber: 'BUS-05', registration: 'KA 01 JK 5120', capacity: '40 seats', route: 'West Gate', status: 'On route', driver: 'Vikram Singh', eta: '10 min' },
  { busNumber: 'BUS-06', registration: 'KA 01 LM 6144', capacity: '36 seats', route: 'Library Loop', status: 'On route', driver: 'Ananya Rao', eta: '15 min' },
  { busNumber: 'BUS-07', registration: 'KA 01 NP 7168', capacity: '40 seats', route: 'Science Park', status: 'Scheduled', driver: 'Karan Patel', eta: '—' },
];

const blankBus: BusRecord = { busNumber: '', registration: '', capacity: '40 seats', route: '', status: 'Scheduled', driver: '', eta: '—' };

export function BusManagement({ search, notify }: { search: string; notify: (message: string) => void }) {
  const [buses, setBuses] = useState<BusRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem('transitpulse-demo-buses') ?? 'null') ?? starterBuses; } catch { return starterBuses; }
  });
  const [editing, setEditing] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<BusRecord>(blankBus);
  const rows = buses.filter((bus) => Object.values(bus).join(' ').toLowerCase().includes(search.toLowerCase()));

  function openAdd() { setEditing(null); setForm(blankBus); setFormOpen(true); }
  function openEdit(index: number) { setEditing(index); setForm(buses[index]); setFormOpen(true); }
  function closeForm() { setEditing(null); setFormOpen(false); }
  function saveBus() {
    if (!form.busNumber.trim() || !form.registration.trim() || !form.route.trim()) { notify('Bus number, registration, and route are required'); return; }
    const next = [...buses];
    if (editing === null) next.push({ ...form, busNumber: form.busNumber.trim().toUpperCase() });
    else next[editing] = { ...form, busNumber: form.busNumber.trim().toUpperCase() };
    setBuses(next); localStorage.setItem('transitpulse-demo-buses', JSON.stringify(next)); closeForm(); notify(editing === null ? 'Bus added' : 'Bus details updated');
  }

  return <><Header title="Buses" desc="Add vehicles and keep bus details up to date." action={<button className="primary" onClick={openAdd}><Plus size={15}/> Add bus</button>}/><div className="stats"><Stat label="Total buses" value={String(buses.length)} note="Across campus" icon={Bus} color="blue"/><Stat label="Active" value={String(buses.filter((bus) => bus.status === 'On route').length)} note="Currently available" icon={Bus} color="green"/><Stat label="Needs attention" value={String(buses.filter((bus) => bus.status === 'Delayed' || bus.status === 'GPS offline').length).padStart(2, '0')} note="Review required" icon={Bus} color="amber"/><Stat label="Updated today" value="08" note="Latest changes" icon={Bus} color="purple"/></div><section className="panel"><PanelHead title="Bus directory" sub={`${rows.length} records`}/><div className="table-scroll"><table><thead><tr><th>Bus</th><th>Registration</th><th>Capacity</th><th>Route</th><th>Driver</th><th>Status</th><th>ETA</th><th/></tr></thead><tbody>{rows.map((bus) => { const index = buses.indexOf(bus); return <tr key={bus.busNumber}><td><div className="vehicle-name"><div className="bus-icon"><Bus/></div><b>{bus.busNumber}</b></div></td><td>{bus.registration}</td><td>{bus.capacity}</td><td>{bus.route}</td><td>{bus.driver || 'Unassigned'}</td><td><Status text={bus.status}/></td><td>{bus.eta}</td><td><button className="icon" onClick={() => openEdit(index)} aria-label={`Edit ${bus.busNumber}`}><Pencil size={15}/></button></td></tr>; })}</tbody></table>{!rows.length&&<p className="empty">No buses found. Add a new bus or try a different search.</p>}</div></section>{formOpen ? <BusForm form={form} setForm={setForm} editing={editing} onClose={closeForm} onSave={saveBus}/> : null}</>;
}

function BusForm({ form, setForm, editing, onClose, onSave }: { form: BusRecord; setForm: (value: BusRecord) => void; editing: number | null; onClose: () => void; onSave: () => void }) {
  const update = (key: keyof BusRecord, value: string) => setForm({ ...form, [key]: value });
  return <div className="overlay" onClick={onClose}><div className="modal bus-form" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><h3>{editing === null ? 'Add bus' : 'Edit bus details'}</h3><p>Update the demo fleet record used by TransitPulse.</p></div><button className="icon" onClick={onClose} aria-label="Close bus form"><X/></button></div><div className="bus-form-grid"><label>Bus number<input value={form.busNumber} onChange={(event) => update('busNumber', event.target.value)} placeholder="BUS-08"/></label><label>Registration<input value={form.registration} onChange={(event) => update('registration', event.target.value)} placeholder="KA 01 QR 8192"/></label><label>Capacity<input value={form.capacity} onChange={(event) => update('capacity', event.target.value)} placeholder="40 seats"/></label><label>Route<input value={form.route} onChange={(event) => update('route', event.target.value)} placeholder="New route"/></label><label>Driver<input value={form.driver} onChange={(event) => update('driver', event.target.value)} placeholder="Unassigned"/></label><label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}><option>Scheduled</option><option>On route</option><option>Delayed</option><option>GPS offline</option></select></label><label>ETA<input value={form.eta} onChange={(event) => update('eta', event.target.value)} placeholder="12 min"/></label></div><button className="primary full" onClick={onSave}><Save size={15}/> Save bus</button></div></div>;
}

function Header({ title, desc, action }: { title: string; desc: string; action?: any }) { return <div className="page-header"><div><div className="eyebrow">TRANSITPULSE / CAMPUS MOBILITY</div><h1>{title}</h1><p>{desc}</p></div>{action && <div className="head-action">{action}</div>}</div>; }
function PanelHead({ title, sub }: { title: string; sub: string }) { return <div className="panel-head"><div><h2>{title}</h2><p>{sub}</p></div></div>; }
function Stat({ label, value, note, icon: Icon, color }: { label: string; value: string; note: string; icon: any; color: string }) { return <div className="stat"><div className="stat-top"><span>{label}</span><div className={'stat-icon '+color}><Icon/></div></div><strong>{value}</strong><small>{note}</small></div>; }
function Status({ text }: { text: string }) { const cls = text === 'Delayed' ? 'warning' : text === 'Scheduled' || text === 'GPS offline' ? 'offline' : 'success'; return <span className={'status '+cls}><i/>{text}</span>; }
