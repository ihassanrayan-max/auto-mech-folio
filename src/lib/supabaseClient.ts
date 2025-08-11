import { supabase as supabaseClient } from "@/integrations/supabase/client";

export const ADMIN_EMAIL = "ihassanrayan@gmail.com";

export function isSupabaseConfigured() {
  // Using Lovable's native Supabase integration (hardcoded URL/key), so it's always configured.
  return true;
}

export const supabase = supabaseClient;
