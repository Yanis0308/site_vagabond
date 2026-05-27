import "server-only";

// Aucune variable privée requise en V0 (pattern client-first, cf. ADR 0007 :
// SDK Supabase browser + ky direct vers Fastify, pas de Server Action
// avec service-role key). Ce fichier existe pour aligner sur la convention
// du Website et accueillera plus tard des entrées telles que
// `SUPABASE_SECRET_KEY` (Admin API en phase 2 B2B).
export const privateEnv = {} as const;
