import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL  = (import.meta as any).env?.VITE_SUPABASE_URL  || '';
const ANON = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabaseEnabled = Boolean(URL && ANON);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(URL, ANON, { auth: { persistSession: false } })
  : null;

if (!supabaseEnabled) {
  // eslint-disable-next-line no-console
  console.info('[supabase] disabled — VITE_SUPABASE_URL/ANON_KEY not set. Falling back to client-only Dexie.');
}
