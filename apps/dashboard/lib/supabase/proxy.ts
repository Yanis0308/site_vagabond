import "server-only";

import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "./server";

// Pattern Supabase SSR canonique : appelle `getUser()` à chaque requête pour
// déclencher le refresh des tokens côté serveur (cf. doc Supabase SSR). Ne fait
// **aucune** redirection ici — la protection des routes est assurée par le
// layout `app/(dashboard)/layout.tsx` qui vit dans le route group des pages
// protégées.
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  const supabaseResponse = NextResponse.next({ request });
  const supabase = await createSupabaseServerClient();

  // IMPORTANT: ne rien faire entre createServerClient et getUser() — sinon les
  // utilisateurs peuvent être déconnectés aléatoirement (cf. doc Supabase).
  await supabase.auth.getUser();

  return supabaseResponse;
}
