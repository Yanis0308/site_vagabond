import "server-only";

import {
  type CookieMethodsServer,
  type CookieOptions,
  createServerClient,
} from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/config/public";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  // falsely deprecated, we correctly using getAll and setAll cookies methods
  return createServerClient(
    publicEnv.SUPABASE_URL,
    publicEnv.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from a Server Component — safe to ignore when
            // session refresh is handled by middleware.
          }
        },
      } as CookieMethodsServer,
    },
  );
}
