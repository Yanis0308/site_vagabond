# @vagabond/api-utils

Bibliothèque partagée de plugins et utilitaires Fastify pour l'API Vagabond.

## Technologies

- **Fastify** - Framework web rapide et léger pour Node.js
- **TypeScript** - Typage statique
- **Zod** - Validation de schémas

## Description

Cette bibliothèque fournit des plugins Fastify réutilisables pour :

- Compression des réponses HTTP
- Gestion des erreurs et réponses standardisées
- Intégration avec la base de données
- Ajout de schémas de validation

## Installation

Cette bibliothèque est utilisée comme dépendance workspace dans le monorepo :

```bash
# Depuis la racine du monorepo
pnpm install
```

## Utilisation

```typescript
import {
  addSchemasPlugin,
  compressPlugin,
  databasePlugin,
  sensiblePlugin,
} from "@vagabond/api-utils";

// Enregistrer les plugins dans votre application Fastify
await fastify.register(compressPlugin);
await fastify.register(sensiblePlugin);
await fastify.register(databasePlugin);
await fastify.register(addSchemasPlugin);
```

## Scripts

- `pnpm build` - Compile TypeScript vers JavaScript
- `pnpm watch` - Mode watch pour le développement
- `pnpm typescript-check` - Vérification TypeScript
- `pnpm lint-check` - Vérification ESLint
- `pnpm prettier-check` - Vérification Prettier

## Structure

```
api-utils/
├── src/
│   ├── index.ts              # Point d'entrée
│   └── plugins/
│       ├── add-schemas.ts    # Plugin d'ajout de schémas
│       ├── compress.ts       # Plugin de compression
│       ├── database.ts      # Plugin de base de données
│       └── sensible.ts      # Plugin sensible (erreurs, etc.)
```
