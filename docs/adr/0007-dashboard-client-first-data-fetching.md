# Dashboard : pattern data fetching client-first (ky + TanStack Query + Jotai), pas RSC-first

Le **Dashboard** adopte le pattern data fetching de la **Mobile App** : Client Components majoritaires, `ky` pour les appels HTTP vers `/api/dashboard/*`, TanStack Query pour le cache et les loading states, Jotai pour le state global. Les React Server Components de Next.js 16 ne servent que de squelette de layout, pas pour fetcher la donnée applicative.

## Considered Options

- **RSC-first** : Server Components fetchent via `fetch` Node, Server Actions pour mutations, `searchParams` pour les filtres. Idiomatique Next.js 16.
- **Hybride** : RSC pour fetch initial, TanStack Query côté client pour rafraîchissements incrémentaux.
- **Client-first (style Mobile App)** — retenu.

## Why

- **Homogénéité avec la Mobile App** : ky + TanStack Query + Jotai sont déjà utilisés par `apps/mobile-app` (`apps/mobile-app/package.json`). L'équipe maîtrise ces outils ; les patterns (query keys, intercepteurs ky, atoms Jotai) sont transférables tels quels au Dashboard. Coût cognitif minimal.
- **Pas d'avantage RSC à perdre** : le Dashboard est non-référencé (cf. ADR 0004 ; `robots.txt Disallow: /`), donc le SEO/SSG n'a aucune valeur. Le TTFB n'est pas critique pour un dashboard interne dont les sessions durent des minutes. Renoncer à RSC ne coûte rien.
- **Phase 2 (édition) déjà dans le bon paradigme** : quand on ajoutera les mutations B2B, on aura déjà les intercepteurs ky, les conventions de query keys et le pattern d'invalidation TanStack Query en place. Pas de migration RSC → client à faire à mi-parcours.
- **Filtres date naturellement interactifs** : changement de `<DateRangePicker>` → atom Jotai mis à jour → query key change → TanStack Query refetch. Pas de navigation, pas de `router.refresh()`, juste une UI qui s'actualise.

## Consequences

- **`ky`, `@tanstack/react-query`, `jotai` installés en V0** (alignés sur les versions de la Mobile App pour cohérence).
- **`@supabase/ssr` quand même nécessaire** pour gérer la session côté Next : le middleware login wall et l'accès au token côté browser passent par `createBrowserClient` + `createServerClient` selon le contexte. Mais aucun Server Component ne fetch de donnée applicative.
- **Loading / error states à gérer explicitement** dans chaque composant via les retours TanStack Query, contrairement à RSC où Suspense + `error.tsx` font le travail.
- **Bundle JS plus gros** que RSC-first (toute la donnée applicative transite par le client). Acceptable pour un dashboard interne ; à monitorer si les listes paginées deviennent énormes.
- **Le token Supabase doit être accessible au JS client** pour qu'un intercepteur `ky` l'attache aux requêtes vers `/api/dashboard/*` — ce qui implique de ne pas stocker l'`access_token` en cookie strictement `httpOnly`. La mitigation XSS repose sur CSP strict + audit des dépendances, pas sur l'inaccessibilité du cookie.
