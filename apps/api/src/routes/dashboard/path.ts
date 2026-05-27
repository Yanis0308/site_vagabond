// Préfixe d'URL pour toutes les routes consommées par le Dashboard (cf.
// ADR 0005). Le plugin auth route la validation des JWT vers Supabase quand
// `request.url.startsWith(DASHBOARD_API_PREFIX)`, sinon vers Firebase
// (comportement actuel pour la Mobile App).
export const DASHBOARD_API_PREFIX = "/api/dashboard";
