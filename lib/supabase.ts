import { createClient } from "@supabase/supabase-js";

// Falls back to a syntactically valid placeholder so builds (and page-data
// collection) succeed before real Supabase env vars are configured — actual
// queries will fail at runtime until NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set.
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = rawUrl && /^https?:\/\//.test(rawUrl) ? rawUrl : "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
