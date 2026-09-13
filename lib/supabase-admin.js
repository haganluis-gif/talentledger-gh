import { createClient } from "@supabase/supabase-js";

let _supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    supabaseUrl === "your-supabase-url" ||
    supabaseUrl.includes("[")
  ) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL to a valid URL (no brackets!) and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  if (!supabaseServiceKey || supabaseServiceKey.startsWith("REPLACE_WITH")) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local to your hosted project's secret/service_role key."
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  return _supabaseAdmin;
}
