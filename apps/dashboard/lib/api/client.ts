import ky, { type KyInstance } from "ky";

import { publicEnv } from "@/lib/config/public";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Instance ky pour le Dashboard. Tape `/api/dashboard/*` de l'API Fastify avec
// un Bearer Supabase attaché côté browser via le SDK (cf. ADR 0007).
//
// IMPORTANT : ce client est destiné à un usage côté client uniquement (un
// composant "use client" ou un hook React Query). Le SDK Supabase browser y
// lit la session depuis le cookie posé par `@supabase/ssr`.
export const api: KyInstance = ky.create({
  prefixUrl: publicEnv.API_URL,
  hooks: {
    beforeRequest: [
      async (request): Promise<void> => {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session !== null) {
          request.headers.set(
            "Authorization",
            `Bearer ${session.access_token}`,
          );
        }
      },
    ],
  },
});
