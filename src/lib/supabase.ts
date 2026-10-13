
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (publishableKey || legacyAnonKey) &&
  !(publishableKey || legacyAnonKey)?.startsWith('PASTE_'),
);

// Keep the UI renderable while local setup is incomplete. Data services call
// requireSupabase() before making a request, so placeholders never reach the network.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.invalid',
  publishableKey || legacyAnonKey || 'missing-publishable-key',
);

export function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
  }
  return supabase;
}
