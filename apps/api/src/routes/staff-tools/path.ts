// Préfixe partagé entre la registration des routes (app.ts) et la garde dev-server + STAFF (plugins/auth.ts)
// pour garantir qu'ils restent synchronisés.
export const STAFF_TOOLS_API_PREFIX = "/api/staff-tools";
