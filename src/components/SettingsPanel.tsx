import { useState } from 'react';
import { Bell, LogOut, Map, Moon, ShieldCheck, UserRound } from 'lucide-react';
import { signOut } from '../lib/services';

export function SettingsPanel({ notify, displayName }: { notify: (message: string) => void; displayName: string }) {
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('transitpulse-email-alerts') !== 'off');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('transitpulse-compact-mode') === 'on');

  function toggle(key: string, value: boolean, setter: (next: boolean) => void) {
    setter(value);
    localStorage.setItem(key, value ? 'on' : 'off');
    notify('Settings saved');
  }

  return <>
    <Header title="Settings" desc="Manage your TransitPulse account and workspace preferences." />
    <div className="settings-layout">
      <section className="panel settings-section"><div className="settings-heading"><UserRound/><div><h2>Account</h2><p>Your authenticated workspace identity</p></div></div><div className="settings-row"><div><b>{displayName}</b><small>Administrator · University Campus</small></div><span className="settings-value">Active profile</span></div><div className="settings-row"><div><b>Session security</b><small>Protected by Supabase authentication and role checks.</small></div><ShieldCheck className="settings-ok"/></div></section>
      <section className="panel settings-section"><div className="settings-heading"><Bell/><div><h2>Notifications</h2><p>Choose how operational updates reach you</p></div></div><label className="settings-toggle"><span><b>Email alerts</b><small>Receive important delay and GPS notices.</small></span><input type="checkbox" checked={emailAlerts} onChange={(event) => toggle('transitpulse-email-alerts', event.target.checked, setEmailAlerts)}/></label></section>
      <section className="panel settings-section"><div className="settings-heading"><Map/><div><h2>Map display</h2><p>Adjust the operational tracking workspace</p></div></div><label className="settings-toggle"><span><b>Compact information density</b><small>Reduce spacing in fleet lists and tables.</small></span><input type="checkbox" checked={compactMode} onChange={(event) => toggle('transitpulse-compact-mode', event.target.checked, setCompactMode)}/></label><div className="settings-row"><div><b>Map provider</b><small>Leaflet with OpenStreetMap tiles. Attribution is enabled.</small></div><span className="settings-value">OpenStreetMap</span></div></section>
      <section className="panel settings-section"><div className="settings-heading"><Moon/><div><h2>Appearance</h2><p>TransitPulse uses the refined light editorial theme.</p></div></div><div className="settings-row"><div><b>Theme</b><small>White background, black text, and restrained status colors.</small></div><span className="settings-value">Light</span></div></section>
      <section className="settings-danger"><div><b>Sign out of TransitPulse</b><small>End this authenticated session on this device.</small></div><button className="danger" onClick={() => void signOut()}><LogOut size={15}/> Sign out</button></section>
    </div>
  </>;
}

function Header({ title, desc }: { title: string; desc: string }) { return <div className="page-header"><div><div className="eyebrow">TRANSITPULSE / CAMPUS MOBILITY</div><h1>{title}</h1><p>{desc}</p></div></div>; }
