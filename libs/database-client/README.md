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
- `pnpm lint-fix` - Correction automatique ESLint
- `pnpm prettier-check` - Vérification Prettier
- `pnpm prettier-fix` - Correction automatique Prettier

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

## Timestamps (timestamptz partout)

**Règle** : toutes les colonnes datetime utilisent `timestamp with time zone` (alias `timestamptz`), via le helper `tsCol` dans `schema.ts`.

```ts
const timestampWithTz = (name?: string) =>
  timestamp(name ?? "", { precision: 3, withTimezone: true });

const created_at = timestampWithTz("created_at").defaultNow().notNull();
const updated_at = timestampWithTz("updated_at")
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date());
```

### Pourquoi pas `timestamp without time zone` ?

Le driver `node-postgres` sérialise les objets `Date` JS via `Date.prototype.dateToString` qui utilise **la timezone locale du process Node**. Sur une colonne `timestamp WITHOUT time zone`, PG ignore silencieusement l'offset TZ de l'input et stocke l'heure locale brute, ce qui produit deux bugs symétriques :

1. **Insertions décalées** : un dev en `Europe/Paris` (+02:00) insère un `new Date()` ; PG enregistre `<heure locale>` au lieu de `<heure UTC>`.
2. **Lectures décalées** : node-postgres parse les valeurs lues en supposant la TZ locale ; un même `Date` round-trip ne re-matche pas dans une clause `WHERE col = $1`.

Effet observé sur VG-470 : pagination cursor qui boucle indéfiniment sur le même `nextCursor` (l'égalité `created_at = $cursor` ne matche jamais aucune ligne, donc le `WHERE` se réduit à `<`, qui ne fait progresser que partiellement).

### Pourquoi `timestamptz` règle tout

`timestamptz` stocke toujours en UTC en interne. Le driver pg sérialise un `Date` JS en `<iso>+<offset>` et PG **convertit en UTC** au stockage (puisque le type le permet). À la lecture, pg parse la string ISO renvoyée par PG (qui contient l'offset) correctement. L'instant est donc préservé bout en bout, quelle que soit la TZ du process Node.

### Op_class des index

Avec `timestamptz`, les index B-tree explicites doivent utiliser `timestamptz_ops` (pas `timestamp_ops`). Cf. `user_locations_user_id_timestamp_idx`, `idx_processing_results_updated_at` dans `schema.ts`.

### Migration historique

La migration `0025_*` passe toutes les colonnes existantes de `timestamp` → `timestamptz`. Le `SET TIME ZONE 'UTC'` en tête fait que PG interprète les valeurs déjà stockées comme étant en UTC au moment du cast implicite. C'est vrai en production (serveur Fly.io en UTC) ; en local, des données insérées en TZ non-UTC peuvent rester décalées de l'offset historique — sans impact métier puisque toute la suite est cohérente.

### Adresses où le bug pourrait re-pointer son nez

Les `new Date()` côté backend qui finissent dans Drizzle (`createdAt`, `updatedAt`, `lastLogin`, `userLocations.timestamp`) — tous adressés par le passage en `timestamptz`. Si on rajoute une colonne datetime, **toujours passer par `tsCol(...)`**.
