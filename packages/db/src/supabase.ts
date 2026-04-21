import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error(
      '[neomokdeul/db] Missing env NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL). Check apps/*/.env.local.',
    );
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      '[neomokdeul/db] Missing env SUPABASE_SERVICE_ROLE_KEY. Check apps/*/.env.local.',
    );
  }
  if (adminClient) return adminClient;
  adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'neomokdeul-server' } },
  });
  return adminClient;
}
