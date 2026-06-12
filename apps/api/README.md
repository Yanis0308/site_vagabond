# API Vagabond

API backend principale basée sur **Fastify** avec **TypeScript**. Fournit les endpoints REST pour la gestion des POIs (Points d'Intérêt), utilisateurs, recherches et enrichissement de données via LLM (Google AI, Groq). Intègre **Firebase Admin**, **AWS S3**, **PostgreSQL** via Drizzle ORM, et **Slack** pour les notifications.

## Technologies principales

- **Fastify** - Framework web rapide et léger pour Node.js
- **TypeScript** - Typage statique
- **PostgreSQL** - Base de données relationnelle
- **Drizzle ORM** - ORM TypeScript léger et performant
- **Firebase Admin** - Authentification et gestion des utilisateurs
- **AWS S3** - Stockage de fichiers (images)
- **TypeBox** - Définition de schémas JSON Schema avec typage TypeScript
- **AJV** - Validateur JSON Schema
- **Swagger/OpenAPI** - Documentation interactive de l'API
- **LLM** - Google AI (Gemini) et Groq pour l'enrichissement de données

## Architecture

L'API suit une architecture modulaire basée sur les plugins Fastify :

```
apps/api/
├── src/
│   ├── app.ts                      # Configuration principale de l'application
│   ├── server.ts                   # Point d'entrée du serveur
│   ├── plugins/                    # Plugins Fastify
│   │   ├── auth.ts                # Authentification Firebase
│   │   ├── config.ts              # Configuration et variables d'environnement
│   │   ├── database.ts            # Client Drizzle et repositories
│   │   ├── firebase.ts            # Initialisation Firebase Admin
│   │   ├── multipart.ts           # Gestion des uploads de fichiers
│   │   ├── s3.ts                  # Client AWS S3
│   │   ├── security.ts            # Helmet et CORS
│   │   ├── slack.ts               # Intégration Slack pour notifications
│   │   └── swagger.ts             # Documentation Swagger/OpenAPI
│   ├── routes/                    # Routes API
│   │   ├── leaderboard/          # Classement des utilisateurs
│   │   ├── pois/                  # Points d'intérêt
│   │   ├── search/                # Recherche de POIs et villes
│   │   ├── upload/                # Upload de fichiers (images)
│   │   ├── users/                 # Gestion des utilisateurs
│   │   ├── visited-pois/          # POIs visités par les utilisateurs
│   │   └── zones/                 # Statistiques des zones visitées
│   ├── services/                  # Services métier
│   │   ├── poi-enrichment.service.ts  # Service d'enrichissement de POIs
│   │   ├── processing/            # Orchestration du traitement LLM
│   │   └── http/                   # Clients HTTP externes
│   └── utils/                     # Utilitaires
```

### Ordre de chargement des plugins

Les plugins sont enregistrés dans un ordre spécifique pour garantir les dépendances :

1. **Config** - Variables d'environnement via Zod dans `plugins/config.ts` (port lu par `server.ts` via `getListenPort()`)
2. **Schemas** - Ajout des schémas de validation TypeBox
3. **Security** - Helmet et CORS
4. **Swagger** - Documentation API
5. **Firebase** - Initialisation Firebase Admin
6. **Database** - Client Drizzle et repositories
7. **Compress & Sensible** - Utilitaires Fastify
8. **Multipart & S3** - Gestion des fichiers
9. **Slack** - Notifications
10. **Auth** - Authentification (doit être après Firebase et Database)
11. **Routes** - Endpoints API

## Installation

```bash
# Depuis la racine du monorepo
pnpm install
pnpm build:libs   # build initial des libs partagées (cache Turbo)
```

> Pour le développement, préférez `pnpm develop:api` depuis la racine — il orchestre le rebuild automatique des libs (voir [Scripts disponibles](#scripts-disponibles)).

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine de `apps/api/` basé sur `.env.example`.

### Ports (développement local)

| Variable             | Défaut | Fichier                         | Usage                                                         |
| -------------------- | ------ | ------------------------------- | ------------------------------------------------------------- |
| `PORT`               | `3000` | `apps/api/.env`                 | Port d'écoute Fastify (`plugins/config.ts`)                   |
| `DOCKER_DB_API_PORT` | `5432` | `apps/api/dev/.env` (versionné) | Port hôte Postgres Docker ; nom du projet / conteneur Compose |

`API_DATABASE_URL` dans `.env` doit utiliser le même port que `DOCKER_DB_API_PORT` (ex. `@localhost:5432/vagabond`). Pour un worktree en parallèle, modifie `dev/.env` (ex. `5433`) puis aligne `API_DATABASE_URL`.

**Docker Postgres** : Docker Compose Up sur `dev/docker-compose.yml` (charge automatiquement `dev/.env`).

```bash
# Firebase Admin SDK
FIREBASE_ADMIN_SERVICE_ACCOUNT_FILE_BASE64=<base64 encoded service account JSON>

# Database
API_DATABASE_URL="postgresql://user:password@localhost:5432/vagabond"

# S3 Bucket
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_ENDPOINT_URL_S3=https://t3.storage.dev
AWS_ENDPOINT_URL_IAM=https://fly.iam.storage.tigris.dev
AWS_REGION=auto
S3_BUCKET_NAME=dev-vagabond-public
CDN_URL=https://dev-vagabond-public.t3.storage.dev

# Slack config
SLACK_BOT_AUTH_TOKEN=<slack-bot-token>
SLACK_CHANNEL_SIGNUPS=<channel-id>
SLACK_CHANNEL_POI_VALIDATIONS=<channel-id>
SLACK_CHANNEL_APP_REVIEWS=<channel-id>

# Jina API key
JINA_API_KEY=<jina-api-key>

# LLMs
GEMINI_API_KEY=<gemini-api-key>
GROQ_API_KEY=<groq-api-key>

# Wikimedia OAuth2
WIKIMEDIA_OAUTH2_CLIENT_ID=<client-id>
WIKIMEDIA_OAUTH2_CLIENT_SECRET=<client-secret>
```

## Scripts disponibles

```bash
# Développement (watch mode) — depuis la racine, recommandé (rebuild auto des libs)
pnpm develop:api

# Développement local (sans rebuild auto des libs ; nécessite `pnpm build:libs` au préalable)
pnpm develop

# Build
pnpm build

# Production
pnpm start

# Tests
pnpm test

# Vérifications
pnpm typescript-check  # Vérification TypeScript
pnpm lint-check        # Vérification ESLint
pnpm lint-fix          # Correction automatique ESLint
pnpm prettier-check    # Vérification Prettier
pnpm prettier-fix      # Correction automatique Prettier
```

## Endpoints API

### Authentification

Tous les endpoints (sauf `/api/leaderboard`) nécessitent une authentification via un token Firebase Bearer dans le header `Authorization: Bearer <token>`.

### Routes disponibles

#### POIs (Points d'Intérêt)

- **GET** `/api/pois/:id` - Récupère un POI enrichi par son ID
  - Enrichit automatiquement le POI via LLM si nécessaire
  - Utilise plusieurs sources : Google Maps scraping, Jina web scraping, Wikimedia, LLM

#### Recherche

- **GET** `/api/search?q=<query>` - Recherche de POIs et villes
  - Retourne les résultats de recherche correspondant à la requête

#### Utilisateurs

- **GET** `/api/users/me` - Récupère les informations de l'utilisateur connecté

#### POIs visités

- **GET** `/api/visited-pois` - Liste tous les POIs visités par l'utilisateur (legacy non paginé)
- **GET** `/api/visited-pois/:poiId` - Récupère un POI visité spécifique
- **POST** `/api/visited-pois` - Marque un POI comme visité
- **DELETE** `/api/visited-pois/:poiId` - Supprime un POI visité
- **GET** `/api/v2/visited-pois?after=&limit=&boundaryId?=&userId?=` - Timeline du user, **pagination cursor** (`{ items, nextCursor }`)
- **GET** `/api/v2/visited-pois/:poiId?after=&limit=` - Avis d'un POI, **pagination cursor**

#### Leaderboard v2

- **GET** `/api/v2/leaderboard?period=&after=&limit=` - Classement, **pagination cursor**

#### Pagination cursor

Les endpoints `/api/v2/*` paginés utilisent un cursor opaque encodé en base64url (`{ createdAt, id }` ou équivalent). Schéma partagé : `CursorPaginationQuerySchema` dans `@vagabond/shared-utils`. Le tuple `(timestamp, id)` garantit la progression même quand plusieurs lignes ont le même `created_at`. Tant que le serveur renvoie `nextCursor: string`, le client continue ; à la fin, `nextCursor: null`.

Côté repo, **ne jamais** caster un cursor en `::timestamp` à la main — utiliser `lt`/`eq` Drizzle natifs avec un `Date`. Les colonnes datetime sont en `timestamptz` (cf. `libs/database-client/README.md` §Timestamps).

#### Upload

- **POST** `/api/upload` - Upload d'une image (multipart/form-data)
  - Formats acceptés : JPEG, PNG
  - Taille max : 10MB
  - L'image est optimisée avec Sharp et uploadée sur S3

#### Zones

- **GET** `/api/zones/stats` - Statistiques des zones visitées par l'utilisateur

#### Leaderboard

- **GET** `/api/leaderboard?period=<all|month>` - Classement des utilisateurs
  - `period=all` : Classement global
  - `period=month` : Classement du mois en cours

## Documentation API

La documentation Swagger/OpenAPI est disponible à :

- **Développement** : `http://localhost:3000/docs`
- **Production** : `https://<your-domain>/docs`

## Enrichissement de POIs

L'API enrichit automatiquement les POIs en utilisant plusieurs sources :

1. **Jina Web Scraping** - Extraction de contenu web
2. **Wikimedia** - Données depuis Wikipedia/Wikidata
3. **LLM** - Enrichissement via Google AI (Gemini) et Groq

Le processus d'enrichissement est orchestré par `PoiEnrichmentService` et utilise un système de cache pour éviter les enrichissements multiples.

## Développement

### Structure des routes

Chaque route est un plugin Fastify encapsulé. Voir `src/routes/README.md` pour plus de détails.

### Ajout d'une nouvelle route

1. Créer un fichier dans `src/routes/` (ex: `src/routes/my-route/index.ts`)
2. Exporter un plugin Fastify avec vos routes
3. Enregistrer le plugin dans `src/app.ts`

Exemple :

```typescript
import { type FastifyPluginCallbackTypebox } from "@fastify/type-provider-typebox";
import { MyResponseSchema } from "@vagabond/shared-utils";

const routes: FastifyPluginCallbackTypebox = (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["my-route"],
        security: [{ bearerAuth: [] }],
        response: {
          200: MyResponseSchema,
        },
      },
    },
    async function (request, reply) {
      // Votre logique ici
      return await reply.status(200).send({ data: {} });
    },
  );
};

export default routes;
```

### Utilisation des repositories

Les repositories sont accessibles via `fastify.dbRepositories` :

```typescript
const pois = await fastify.dbRepositories.poi.findAll();
const user = await fastify.dbRepositories.user.findById(userId);
```

### Authentification

L'utilisateur authentifié est accessible via `request.user` :

```typescript
const userId = request.user.uid;
const dbUser = request.user.db;
```

## Déploiement

### Fly.io

```bash
fly deploy -c api-fly.toml
```

### Docker

Un `Dockerfile` est disponible pour le déploiement en conteneur.

## Tests

```bash
pnpm test
```

Les tests utilisent le framework de test natif de Node.js avec support TypeScript.

## Sécurité

- **Helmet** - Headers de sécurité HTTP
- **CORS** - Configuration Cross-Origin Resource Sharing
- **Firebase Auth** - Authentification via tokens JWT Firebase
- **Validation** - Tous les inputs sont validés avec TypeBox/AJV
- **Rate Limiting** - À implémenter si nécessaire

## Notes importantes

- L'API utilise TypeBox pour la validation des schémas (migration en cours depuis Zod)
- Les schémas sont partagés via `@vagabond/shared-utils`
- La documentation Swagger est générée automatiquement depuis les schémas TypeBox
- Les images uploadées sont optimisées avec Sharp avant l'upload sur S3
