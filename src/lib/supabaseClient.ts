import { createClient } from "@supabase/supabase-js";

// Lovable Supabase native integration: URL/key should be injected by the platform.
// We avoid VITE_* envs per project rules. If missing, admin UI will show a setup notice.
// You can also expose SUPABASE_URL and SUPABASE_ANON_KEY on window for local dev.
const supabaseUrl = (window as any)?.SUPABASE_URL || (window as any)?.__SUPABASE_URL__ || "";
const supabaseAnonKey = (window as any)?.SUPABASE_ANON_KEY || (window as any)?.__SUPABASE_ANON_KEY__ || "";

export const ADMIN_EMAIL = "ihassanrayan@gmail.com";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
