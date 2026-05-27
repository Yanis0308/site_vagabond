import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/config/public";

export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(
    publicEnv.SUPABASE_URL,
    publicEnv.SUPABASE_PUBLISHABLE_KEY,
  );
}
