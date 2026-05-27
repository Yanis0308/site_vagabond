import { type DbUser } from "@vagabond/database-client";
import { type FastifyRequest } from "fastify";
import { type auth } from "firebase-admin";

// Identité Mobile (+ staff-tools), remplie par `plugins/auth.ts` après
// vérification du JWT Firebase et upsert de la projection locale `users`.
export type MobileUser = auth.DecodedIdToken & {
  db: DbUser;
};

type MobileRequest = FastifyRequest & {
  user: MobileUser;
};

// Helper de cast par **intersection** (cf. ADR 0009). Préserve intégralement
// l'inférence TypeBox du `req` (body, querystring, params, headers) et n'ajoute
// QUE le champ `user` garanti par le middleware `auth.ts`. Ne touche pas à
// `reply`, qui reste typé par le response schema TypeBox.
//
// Sécurité : ce helper ne fait QUE du cast typé. La vérification réelle (JWT
// Firebase + upsert DB) est portée par `auth.ts` via un hook `onRequest`
// global qui skip les routes Dashboard (préfixe `/api/dashboard/*`) et les
// PUBLIC_PATHS — défense en profondeur impossible à oublier.
//
// L'import de ce helper est restreint par ESLint (`no-restricted-imports`)
// aux routes Mobile (+ staff-tools dev) et au plugin `auth.ts` ; ailleurs
// c'est une erreur de lint.
export function asMobileRequest<R extends FastifyRequest>(
  req: R,
): R & MobileRequest {
  return req as R & MobileRequest;
}
