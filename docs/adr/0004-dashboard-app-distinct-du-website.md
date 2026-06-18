# Dashboard : application séparée plutôt qu'intégrée au Website

Le **Dashboard** vit dans un nouvel app `apps/dashboard` (Next.js + Tailwind + Jotai + shadcn + ky) avec son propre projet Vercel et son propre domaine, plutôt que comme une route `/admin` du **Website** existant.

## Considered Options

- **Intégration au Website** (`apps/website/app/[locale]/admin/...` protégé par middleware Next).
- **App séparée** `apps/dashboard` — retenu.

## Why

- **Blast radius SEO** : le **Website** est public, référencé, multilingue, avec sitemap ouvert. Une erreur de middleware dans un `/admin` cohabité ferait fuiter la donnée interne. Un projet distinct rend l'indexation impossible _par construction_ (`noindex` global, accès via Vercel Password Protection ou IP allowlist).
- **Auth alignée sur la source de données** : le **Website** utilise l'auth native de Payload CMS pour le back-office du CMS ; le **Dashboard** consomme l'**API**, donc s'authentifie contre l'auth de l'**API** (Firebase ID token + `roleEnum`). Cohabiter deux systèmes d'auth dans un même Next.js crée une zone grise sur "quel utilisateur est connecté".
- **Indépendance de release** : déployer ou rollback le **Dashboard** ne doit pas toucher au site marketing.

## Consequences

- Configuration initiale dupliquée (Next, Tailwind, shadcn, ky client). Accepté ; si la duplication devient gênante, extraire un `libs/web-ui` partagé.
- Le **Dashboard** ne pourra pas réutiliser les composants du **Website** sans extraction préalable.
