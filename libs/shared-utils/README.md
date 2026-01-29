# @vagabond/shared-utils

Bibliothèque d'utilitaires et schémas partagés entre tous les projets du monorepo.

## Technologies

- **TypeScript** - Typage statique
- **Zod** - Validation de schémas (via les schémas)
- **AJV** - Validateur JSON Schema

## Description

Cette bibliothèque centralise :

- Schémas de validation Zod pour l'API
- Schémas de données partagés (POIs, users, etc.)
- Utilitaires de validation
- Utilitaires pour les POIs et utilisateurs
- Logger partagé
- Types et enums communs

## Installation

Cette bibliothèque est utilisée comme dépendance workspace dans le monorepo :

```bash
# Depuis la racine du monorepo
pnpm install
```

## Utilisation

```typescript
// Importer des schémas
import { poiEnrichedSchema, userSchema } from "@vagabond/shared-utils";

// Importer des utilitaires
import { validatePoi, normalizeUser } from "@vagabond/shared-utils";

// Importer des types
import type { PoiEnriched, User } from "@vagabond/shared-utils";
```

## Scripts

- `pnpm build` - Compile TypeScript vers JavaScript
- `pnpm develop` - Mode watch pour le développement
- `pnpm typescript-check` - Vérification TypeScript
- `pnpm lint-check` - Vérification ESLint
- `pnpm prettier-check` - Vérification Prettier

## Structure

```
shared-utils/
├── src/
│   ├── index.ts                    # Point d'entrée
│   ├── schemas/
│   │   ├── api/                    # Schémas API
│   │   │   ├── poi-enriched.ts
│   │   │   ├── user.ts
│   │   │   ├── search.ts
│   │   │   └── ...
│   │   ├── processors/             # Schémas de traitement LLM
│   │   ├── geo.ts                  # Schémas géographiques
│   │   ├── enums.ts                # Énumérations
│   │   └── ...
│   └── utils/
│       ├── validation.ts           # Utilitaires de validation
│       ├── poi.ts                  # Utilitaires POI
│       ├── user.ts                 # Utilitaires utilisateur
│       └── logger.ts               # Logger partagé
```

## Schémas disponibles

### API

- `poiEnrichedSchema` - Schéma pour un POI enrichi
- `userSchema` - Schéma utilisateur
- `searchSchema` - Schéma de recherche
- `visitedPoiSchema` - Schéma POI visité
- `leaderboardSchema` - Schéma de classement
- Et plus...

### Processeurs

- Schémas pour le traitement LLM des données POI
- Schémas requis vs optionnels pour le traitement

### Géographie

- Schémas pour les coordonnées géographiques
- Schémas pour les zones et boundaries
