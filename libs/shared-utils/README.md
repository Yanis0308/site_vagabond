# @vagabond/shared-utils

Bibliothèque d'utilitaires et schémas partagés entre tous les projets du monorepo.

## Technologies

- **TypeScript** - Typage statique
- **TypeBox** - Définition de schémas JSON Schema avec typage TypeScript
- **AJV** - Validateur JSON Schema

## Description

Cette bibliothèque centralise :

- Schémas de validation TypeBox pour l'API
- Schémas de données partagés (POIs, users, etc.)
- Utilitaires de validation
- Utilitaires pour les POIs et utilisateurs
- Logger partagé
- Types et enums communs

## Validation des schémas

Cette bibliothèque utilise **TypeBox** et **AJV** pour la validation des schémas :

- **TypeBox** : Définition de schémas JSON Schema avec typage TypeScript automatique
- **AJV** : Validation runtime des données selon les schémas TypeBox

### Pourquoi TypeBox ?

TypeBox est utilisé pour plusieurs raisons :

- **Typage TypeScript automatique** : Génération automatique des types TypeScript à partir des schémas, évitant la duplication entre schémas et types
- **JSON Schema natif** : Génère des schémas JSON Schema standard, permettant une compatibilité avec de nombreux outils et validateurs
- **Syntaxe familière** : Syntaxe similaire à Zod mais avec support JSON Schema natif, facilitant la migration
- **Intégration AJV** : Compatibilité parfaite avec AJV pour une validation performante
- **Réutilisabilité** : Les schémas peuvent être utilisés pour la validation runtime, la génération de types, et la documentation OpenAPI
- **Standards ouverts** : Basé sur JSON Schema, un standard ouvert largement supporté

### Pourquoi AJV ?

AJV est utilisé pour plusieurs raisons :

- **Performance** : AJV est l'un des validateurs JSON Schema les plus rapides disponibles. Cette performance vient du fait qu'AJV **compile chaque schéma en une fonction JavaScript optimisée** lors de la compilation. Contrairement aux validateurs qui interprètent le schéma à chaque validation, AJV génère du code spécialisé pour chaque schéma, ce qui permet une validation beaucoup plus rapide, surtout lors de validations répétées
- **Support JSON Schema complet** : Support complet de la spécification JSON Schema, permettant des validations complexes
- **Intégration Fastify** : AJV est le validateur par défaut de Fastify (utilisé dans notre API), permettant une validation cohérente entre les schémas partagés et les endpoints API
- **Compatibilité TypeBox** : TypeBox génère des schémas JSON Schema compatibles avec AJV, créant un workflow fluide de définition à validation
- **Validation côté serveur** : Optimisé pour la validation de grandes quantités de données en production grâce à la compilation des schémas en fonctions

**Migration en cours** : Nous migrons progressivement de **Zod** vers **TypeBox + AJV** pour une meilleure intégration avec JSON Schema et une validation plus performante. Les nouveaux schémas doivent être créés avec TypeBox. Zod sera progressivement retiré du projet.

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
- `pnpm lint-fix` - Correction automatique ESLint
- `pnpm prettier-check` - Vérification Prettier
- `pnpm prettier-fix` - Correction automatique Prettier

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
