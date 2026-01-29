# @vagabond/database-client

Client de base de données utilisant Drizzle ORM pour PostgreSQL.

## Technologies

- **Drizzle ORM** - ORM TypeScript léger et performant
- **PostgreSQL** - Base de données relationnelle
- **TypeScript** - Typage statique
- **Drizzle Kit** - Outils de migration et génération de schémas

## Description

Cette bibliothèque fournit :

- Client de connexion à PostgreSQL
- Schémas de base de données définis avec Drizzle
- Repositories pour les entités principales (POIs, boundaries, users, etc.)
- Migrations de base de données
- Types TypeScript générés à partir du schéma

## Installation

Cette bibliothèque est utilisée comme dépendance workspace dans le monorepo :

```bash
# Depuis la racine du monorepo
pnpm install
```

## Configuration

Variables d'environnement requises :

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

## Utilisation

```typescript
import { drizzleClient } from "@vagabond/database-client";
import { pois, boundaries } from "@vagabond/database-client/schema";

// Utiliser le client drizzle
const result = await drizzleClient.select().from(pois).limit(10);
```

## Migrations

Générer une nouvelle migration :

```bash
cd libs/database-client
pnpm drizzle-generate
```

Les migrations sont stockées dans `src/migrations/`.

## Scripts

- `pnpm build` - Compile TypeScript et copie les migrations
- `pnpm watch` - Mode watch pour le développement
- `pnpm drizzle-generate` - Génère les migrations depuis le schéma
- `pnpm develop` - Mode développement avec watch TypeScript et génération Drizzle
- `pnpm typescript-check` - Vérification TypeScript
- `pnpm lint-check` - Vérification ESLint
- `pnpm prettier-check` - Vérification Prettier

## Structure

```
database-client/
├── src/
│   ├── index.ts                    # Point d'entrée
│   ├── drizzleClient.ts           # Client Drizzle configuré
│   ├── schema.ts                   # Schémas de tables Drizzle
│   ├── types.ts                    # Types TypeScript
│   ├── versions.ts                 # Versions de schéma
│   ├── migrations/                 # Migrations SQL
│   └── repositories/               # Repositories pour chaque entité
│       ├── poi.repository.ts
│       ├── boundary.repository.ts
│       ├── user.repository.ts
│       └── ...
```

## Entités principales

- **POIs** - Points d'intérêt géographiques
- **Boundaries** - Frontières administratives
- **Users** - Utilisateurs de l'application
- **Visited POIs** - POIs visités par les utilisateurs
- **Search** - Historique de recherches
- **Processing Results** - Résultats de traitement LLM
