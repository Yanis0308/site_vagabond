import { atomWithStorage } from "jotai/utils";

// Persistance du choix d'org de l'user à travers les sessions (cf. ADR 0009).
// Stocké en localStorage : la home `/` (Client Component) le lit pour décider
// la redirection initiale ; le layout `orgs/[orgSlug]/` le met à jour à chaque
// navigation vers une org. La source de vérité **runtime** de l'org active
// reste le path Next.js (`[orgSlug]`) — cet atom n'est qu'un fallback pour
// retrouver le dernier choix entre deux sessions.
export const lastOrgSlugAtom = atomWithStorage<string | null>(
  "dashboard.lastOrgSlug",
  null,
);
