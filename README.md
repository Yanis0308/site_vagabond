# vagagond-poc

Monorepo pour l'application Vagabond - plateforme de découverte de points d'intérêt géographiques.

## Projets

### Applications (`/apps`)

#### [API](./apps/api/README.md)

API backend principale basée sur **Fastify** avec **TypeScript**. Fournit les endpoints REST pour la gestion des POIs, utilisateurs, recherches et enrichissement de données via LLM (Google AI, Groq). Intègre **Firebase Admin**, **AWS S3**, **PostgreSQL** via Drizzle ORM, et **Slack** pour les notifications.

#### [Mobile App](./apps/mobile-app/README.md)

Application mobile React Native avec **Expo** et **Expo Router**. Utilise **NativeWind** (Tailwind CSS), **React Query**, **Mapbox**, **Firebase Auth**, **Jotai** pour l'état global, et **i18next** pour l'internationalisation. Supporte iOS et Android avec builds via EAS.

#### [Data Scraper](./apps/data-scraper/README.md)

API de scraping Google Maps utilisant **Puppeteer** et **Fastify**. Extrait les données détaillées des lieux depuis Google Maps en temps réel avec validation TypeBox et gestion robuste du browser.

#### [Data Manager](./apps/data-manager/README.md)

Pipeline ETL pour traiter les données **OpenStreetMap** (PBF) et les préparer pour l'API et **Mapbox**. Utilise **osm2pgsql**, **PostgreSQL**, **Knex**, et génère des fichiers JSONL pour l'import en base et l'upload vers Mapbox Tilesets.

#### [Web Dashboard](./apps/web-dashboard/README.md) (non maintenu)

Dashboard web **Next.js** avec **React Query** et **MapLibre GL** pour la visualisation et la gestion des POIs et boundaries. Utilise **Supercluster** pour le clustering de points sur la carte.

#### [Website](./apps/website/README.md) (non maintenu)

Site web marketing **Next.js** avec **i18next** pour le multilinguisme, **React Email** pour les emails transactionnels, **Supabase**, **Vercel Analytics**, et intégration **Facebook Pixel**.

### Bibliothèques (`/libs`)

#### [API Utils](./libs/api-utils/README.md)

Bibliothèque de plugins **Fastify** réutilisables : compression, gestion d'erreurs, intégration base de données, et ajout de schémas de validation.

#### [Database Client](./libs/database-client/README.md)

Client de base de données avec **Drizzle ORM** pour **PostgreSQL**. Contient les schémas, migrations, repositories et types TypeScript pour toutes les entités (POIs, boundaries, users, etc.).

#### [Shared Utils](./libs/shared-utils/README.md)

Bibliothèque d'utilitaires et schémas partagés : schémas JSON ou Zod pour l'API, types TypeScript communs, utilitaires de validation, logger, et helpers pour POIs et utilisateurs.

---

## Installation

Pour installer toutes les dépendances et builder les bibliothèques du monorepo :

```bash
pnpm install
```

Cette commande :

- Installe toutes les dépendances du monorepo
- Rebuild automatiquement les bibliothèques (`@vagabond/api-utils`, `@vagabond/database-client`, `@vagabond/shared-utils`) grâce aux scripts `postinstall` configurés
- Applique les patchs pnpm configurés

Les bibliothèques sont compilées automatiquement après l'installation grâce aux scripts `postinstall` définis dans leurs `package.json`.

> **Important** : Lorsqu'une bibliothèque (`/libs`) est modifiée, il faut relancer `pnpm install` pour rebuilder la bibliothèque et que les changements soient pris en compte par les applications qui l'utilisent.

## Notes techniques

We have a custom patch to solve this typing issue https://github.com/gluestack/gluestack-ui/issues/2898

Keep a eye on this issue for box-shadow support in nativewind https://github.com/nativewind/nativewind/issues/1442  
We've tried the purposed patch but color not works, even with our custom code try to differenciate number value to px and colors
We will use RN Stylesheet to make nice shadow meanwhile

We disabled inlineRem in metro.config.js to use 16px as base font size

## Patchs pnpm

Ce projet utilise les patchs pnpm suivants (configurés dans `package.json` sous `pnpm.patchedDependencies`):

- **ajv@8.17.1** (`patches/ajv@8.17.1.patch`)
  - Modifie le comportement d'ajv pour logger des warnings au lieu de lancer des erreurs pour les références de schéma ambiguës ou les schémas dupliqués
  - Permet de gérer les cas où plusieurs schémas partagent le même ID ou référence

- **fastify** (`patches/fastify.patch`)
  - Modifie fastify pour logger au lieu de lancer une erreur quand un schéma avec le même ID est déjà présent
  - Évite les erreurs lors de l'ajout de schémas dupliqués

Pour appliquer les patchs après une installation de dépendances:

```bash
pnpm install
```

## Déploiement avec fly.io

- **API** : `fly deploy -c api-fly.toml`
- **Data Scraper** : `fly deploy -c data-scraper-fly.toml`
