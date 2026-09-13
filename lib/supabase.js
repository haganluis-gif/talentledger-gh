import { createClient } from "@supabase/supabase-js";

let _supabase = null;

export function getSupabase() {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    supabaseUrl === "your-supabase-url" ||
    supabaseUrl.includes("[")
  ) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL to a valid URL (no brackets!) and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.startsWith("REPLACE_WITH")) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to your hosted project's publishable/anon key."
    );
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}
