import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

let supabase: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabase) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    supabase = createSupabaseClient(supabaseUrl, publicAnonKey);
  }
  return supabase;
}
