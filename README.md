# vagagond-poc

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
