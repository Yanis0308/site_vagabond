# Pattern URL Dashboard et architecture middleware

L'API Dashboard utilise deux espaces : `/api/dashboard/me/*` (identité hors-org) et `/api/dashboard/orgs/:orgSlug/*` (org-scopé). Toute la logique d'auth Supabase et de chargement du contexte tenant vit dans un seul plugin `auth-dashboard.ts`. Les champs `request.dashboardUser` et `request.dashboardOrg` ne sont **pas** augmentés globalement via `declare module "fastify"` : ils sont exposés au typage des contrôleurs via des wrappers de handler `dashboardBaseHandler` / `dashboardOrgHandler`.

## Considered Options

### Identification de l'org dans la requête

- Sous-domaine `acme.dashboard.vagabond.com` : isolation visuelle mais DNS wildcard + certs SSL à gérer, switch d'org pénible (cookies par domaine).
- Header `X-Org-Id` : invisible dans logs/URL/browser history, oubli côté client = 400.
- **Path-scoped `/orgs/:orgSlug/`** — retenu.
- JWT claim Supabase : couple identité et tenant, switch d'org = refresh token complet.

### Découpage middleware

- Tout dans `auth.ts` existant (étendu pour Dashboard) : 200+ lignes de branchements, test difficile.
- Deux plugins disjoints (`auth` Firebase + `dashboard-tenant`) : séparation par concern.
- **Plugin unique `auth-dashboard.ts`** (auth Supabase + tenant) — retenu, séparation par **domaine**.

### Typage `request.dashboardUser` / `request.dashboardOrg`

- `declare module "fastify"` global avec champs non-optionnels : mensonge contractuel (sur `/me/*`, `dashboardOrg` est `undefined` au runtime).
- `declare module` global avec champs optionnels : code défensif partout (`if (!req.dashboardOrg) throw`).
- **Types standalone + wrappers `dashboardBaseHandler` / `dashboardOrgHandler`** — retenu, pas de `declare module` pour les champs Dashboard.

## Why

1. **Path-scoping** : l'`orgSlug` est visible dans tous les logs, Sentry, browser history et bookmarks B2B. Switch d'org = changement de path (pas de re-login, pas de refresh JWT). Le sous-router Fastify enregistré via `register({ prefix: "/api/dashboard/orgs/:orgSlug" })` rend l'oubli du middleware tenant **structurellement impossible**.

2. **Plugin unique par domaine** : tout le code Dashboard vit dans un seul fichier, `auth.ts` Mobile reste intact. Cohérent avec le préfixe d'URL (un domaine = un plugin), évite la coordination « qui s'exécute avant l'autre » entre 2 plugins disjoints.

3. **Wrappers handler pour le typage** : Fastify TS avec `declare module` est intrinsèquement global → impossible de typer « `dashboardOrg` présent uniquement dans `/orgs/:slug/*` » via la mécanique standard. Les types standalone exposés via wrappers donnent une garantie compile-time sans le mensonge non-optionnel. **Le wrapper ne fait QUE du cast typé — l'auth elle-même reste portée par le middleware path-based** (sécurité par construction, pas par convention).

## Conséquences

- **Routing Fastify** : toutes les routes Dashboard sont enregistrées via `register({ prefix: ... })`. Le préfixe `/api/dashboard/me` n'a pas de middleware tenant ; `/api/dashboard/orgs/:orgSlug` en a un en `preHandler` qui retourne `404` si pas de membership (privacy by default : on ne révèle pas l'existence d'une org à un user non autorisé).

- **Refacto Mobile** prévu en PR séparé post-Dashboard : appliquer le même pattern (`mobileHandler` wrapper, retrait du `declare module` Firebase global). Tant que ce refacto n'est pas fait, `request.user` reste augmenté globalement via `auth.ts` mais les wrappers Dashboard cast vers un type qui ne l'inclut pas → invisible côté contrôleur Dashboard.

- **Le contrat runtime « `request.dashboardOrg` est rempli sur `/orgs/:slug/*` »** est porté par le placement du middleware et la convention du wrapper, pas par TypeScript. Un oubli au runtime se manifesterait par un `Cannot read .id of undefined`, pas un compile error — la garantie vit dans l'organisation du code, pas dans le type system.

- **Frontend Next.js** : routes mirroir `app/(dashboard)/orgs/[orgSlug]/...`. La page `/` est un Client Component qui redirige via un Jotai atom persisté en `localStorage` (`lastOrgSlugAtom`) — pas de cookie HTTP-only, cohérent avec l'ADR 0007 « client-first ». Le composant `<OrgPicker />` dans la sidebar est visible ssi l'user a au moins un membership dans une org `business_type='staff'`.

- **Endpoint `GET /api/dashboard/me`** : single source agrégé (`user` + `organizations[]` avec `scope` et `features` pré-calculés). Acceptable tant qu'un user a < 10 orgs ; à scinder en `/me` (light) + `/orgs/:slug/context` (détail à la demande) le jour où des staffs cumulent des dizaines de memberships d'intervention.
