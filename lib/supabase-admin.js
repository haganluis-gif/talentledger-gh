import { createClient } from "@supabase/supabase-js";

let _supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || supabaseUrl === "your-supabase-url") {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  return _supabaseAdmin;
}
