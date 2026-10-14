import { createContext, FormEvent, ReactNode, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { getMyProfile, signIn, signInWithGoogle, signOut, signUp } from './lib/services';
import type { Profile } from './lib/types';

interface AuthGateProps { children: ReactNode }

export const AuthProfileContext = createContext<Profile | null>(null);

export function useAuthProfile() {
  return useContext(AuthProfileContext);
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => { if (mounted) setSession(data.session); }).catch(() => {
      if (mounted) setMessage('Your authentication session could not be restored. Please sign in again.');
    }).finally(() => { if (mounted) setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) { setSession(nextSession); setAuthLoading(false); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const oauthError = params.get('error_description') || params.get('error') || hashParams.get('error_description') || hashParams.get('error');
    if (oauthError) {
      setMessage(`Google sign-in could not be completed: ${oauthError.replace(/\+/g, ' ')}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    void getMyProfile().then(({ data, error }) => {
      if (error) setMessage(error.message);
      else setProfile(data);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Profile could not be loaded.'));
  }, [session]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const result = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);
      if (result.error) throw result.error;
      setMessage(mode === 'signup' ? 'Account created. Check your email if confirmation is enabled.' : 'Signed in.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally { setBusy(false); }
  }

  async function continueWithGoogle() {
    setBusy(true); setMessage('');
    if (import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== 'true') {
      setMessage('Google sign-in is not enabled yet. Enable Google in Supabase Authentication → Providers and set VITE_GOOGLE_AUTH_ENABLED=true after configuring OAuth credentials.');
      setBusy(false);
      return;
    }
    try {
      const result = await signInWithGoogle();
      if (result.error) throw result.error;
      if (!result.data.url) throw new Error('Google sign-in did not return an authorization URL.');
      window.location.assign(result.data.url);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in could not be started.');
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured) return <main className="auth-card"><p className="auth-kicker">TRANSITPULSE / CAMPUS MOBILITY</p><h1>TransitPulse setup</h1><p>Add your Supabase publishable or legacy anon key to <code>.env.local</code>, then restart Vite.</p><p>Required for login: <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> or <code>VITE_SUPABASE_ANON_KEY</code>.</p></main>;
  if (authLoading) return <main className="auth-card"><p className="auth-kicker">TRANSITPULSE / CAMPUS MOBILITY</p><h1>Restoring your session</h1><p>Checking your authenticated workspace session…</p></main>;
  if (!session) return <main className="auth-card"><p className="auth-kicker">TRANSITPULSE / CAMPUS MOBILITY</p><h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1><p>Sign in to access authorized transport data.</p>{mode === 'signin' && <><button className="google-button" onClick={() => void continueWithGoogle()} disabled={busy}><span className="google-mark">G</span> Continue with Google</button><div className="auth-divider"><span>or continue with email</span></div></>}<form onSubmit={submit} className="auth-form"><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{mode === 'signup' && <label>Full name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>}<label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary" disabled={busy}>{busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Register'}</button></form>{message && <p role="status">{message}</p>}<button className="text-button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Create an account' : 'Back to sign in'}</button></main>;
  if (!profile?.is_active) return <main className="auth-card"><p className="auth-kicker">TRANSITPULSE / CAMPUS MOBILITY</p><h1>Account pending</h1><p>Your account is authenticated, but no active TransitPulse profile is available yet. Ask an authorized administrator to activate your role.</p><button className="secondary" onClick={() => void signOut()}>Sign out</button>{message && <p role="status">{message}</p>}</main>;
  return <AuthProfileContext.Provider value={profile}>{children}</AuthProfileContext.Provider>;
}
