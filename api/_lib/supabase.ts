import { createClient } from '@supabase/supabase-js';
import { HttpError } from './http.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Missing Supabase server environment variables');
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://example.supabase.co',
  serviceRoleKey || 'missing-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export function assertSupabaseEnv() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(500, 'Supabase server environment is not configured');
  }
}
