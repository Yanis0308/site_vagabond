# vagaGond-poc

Monorepo pour l'application Vagabond - plateforme de découverte de points d'intérêt géographiques.

## Table des matières

- [Technologies principales](#technologies-principales)
- [MCP (Model Context Protocol)](#mcp-model-context-protocol)
- [Projets](#projets)
  - [Applications](#applications-apps)
  - [Bibliothèques](#bibliothèques-libs)
- [Installation](#installation)
- [Déploiement avec fly.io](#déploiement-avec-flyio)
- [Contribuer à Vagabond](#contribuer-à-vagabond)
  - [Code de conduite](#code-de-conduite)
  - [Workflow de développement](#workflow-de-développement)
  - [Standards de code](#standards-de-code)
  - [Directives de commit](#directives-de-commit)
  - [Processus de Pull Request](#processus-de-pull-request)
  - [Directives de revue de code](#directives-de-revue-de-code)
  - [Tests](#tests)
  - [Documentation](#documentation)
  - [Structure du monorepo](#structure-du-monorepo)
  - [Notes techniques pour contributeurs](#notes-techniques-pour-contributeurs)

## Technologies principales

- **Backend** : Fastify, TypeScript, PostgreSQL (Drizzle ORM), Firebase Admin, AWS S3
- **Mobile** : React Native, Expo, Expo Router, NativeWind, React Query, Mapbox, Jotai
- **Validation** : TypeBox, AJV
- **Base de données** : PostgreSQL, Drizzle ORM
- **Infrastructure** : Fly.io, pnpm workspaces, Expo EAS (Expo Application Services)
- **LLM** : Google AI, Groq

## MCP (Model Context Protocol)

Ce projet utilise **MCP (Model Context Protocol)** pour améliorer le contexte et les capacités des assistants IA lors du développement.

La documentation complète sur l'utilisation et la configuration des MCP est disponible sur Notion : [Documentation MCP](https://www.notion.so/vagabond/MCP-Documentation)

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
- Applique les patchs pnpm configurés (voir la section [Patchs pnpm](#patchs-pnpm) pour plus de détails)

Les bibliothèques sont compilées automatiquement après l'installation grâce aux scripts `postinstall` définis dans leurs `package.json`.

> **Important** : Lorsqu'une bibliothèque (`/libs`) est modifiée, il faut relancer `pnpm install` pour rebuilder la bibliothèque. Voir la section [Modifier les bibliothèques partagées](#modifier-les-bibliothèques-partagées) pour plus de détails.

## Notes techniques

### Support des ombres (box-shadow) dans NativeWind pour l'application mobile

Nous suivons cette issue pour le support des box-shadow dans NativeWind : https://github.com/nativewind/nativewind/issues/1442

**Gestion actuelle** : Comme le support natif des box-shadow n'est pas encore disponible dans NativeWind, nous utilisons `StyleSheet` de React Native pour créer des ombres. Les styles d'ombres sont définis dans des fichiers dédiés (ex: `shadowStyles.ts`) et appliqués via `StyleSheet.create()`.

### Issue de typage Gluestack UI pour l'application mobile

Nous suivons cette issue concernant un problème de typage dans Gluestack UI : https://github.com/gluestack/gluestack-ui/issues/2898

### Configuration Metro dans l'application mobile

- Nous avons désactivé `inlineRem` dans `metro.config.js` pour utiliser 16px comme taille de police de base.

## Patchs pnpm pour tous les projets

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

---

# Contribuer à Vagabond

Merci de votre intérêt pour contribuer à Vagabond ! Ce document fournit les lignes directrices et les meilleures pratiques pour contribuer au projet.

## Table des matières

- [Code de conduite](#code-de-conduite)
- [Workflow de développement](#workflow-de-développement)
- [Standards de code](#standards-de-code)
- [Directives de commit](#directives-de-commit)
- [Processus de Pull Request](#processus-de-pull-request)
- [Directives de revue de code](#directives-de-revue-de-code)
- [Tests](#tests)
- [Documentation](#documentation)
- [Structure du monorepo](#structure-du-monorepo)

## Code de conduite

Les dix commandements de la programmation sans ego, établis à l'origine dans le livre _The Psychology of Computer Programming_ de Jerry Weinberg :

1. **Comprenez et acceptez que vous ferez des erreurs.** L'objectif est de les trouver tôt, avant qu'elles n'atteignent la production. Heureusement, à l'exception de ceux d'entre nous qui développent des logiciels de guidage de fusées au JPL, les erreurs sont rarement fatales dans notre industrie, nous pouvons donc apprendre, en rire et passer à autre chose.

2. **Vous n'êtes pas votre code.** Rappelez-vous que tout l'intérêt d'une revue est de trouver des problèmes, et des problèmes seront trouvés. Ne le prenez pas personnellement quand un problème est découvert.

3. **Peu importe combien de "karaté" vous connaissez, quelqu'un d'autre en saura toujours plus.** Une telle personne peut vous apprendre de nouveaux mouvements si vous le demandez. Recherchez et acceptez les retours des autres, _surtout_ quand vous pensez que ce n'est pas nécessaire.

4. **Ne réécrivez pas le code sans consultation.** Il y a une fine ligne entre "corriger le code" et "réécrire le code". Connaissez la différence et poursuivez les changements stylistiques dans le cadre d'une revue de code, pas comme un exécuteur solitaire.

5. **Traitez les personnes qui en savent moins que vous avec respect, déférence et patience.** Les personnes non techniques qui traitent régulièrement avec les développeurs ont presque universellement l'opinion que nous sommes des prima donnas au mieux et des pleurnichards au pire. Ne renforcez pas ce stéréotype avec la colère et l'impatience.

6. **La seule constante dans le monde est le changement.** Soyez ouvert et acceptez-le avec le sourire. Regardez chaque changement de vos exigences, plateforme ou outil comme un nouveau défi, pas comme une gêne sérieuse à combattre.

7. **La seule vraie autorité découle de la connaissance, pas de la position.** La connaissance engendre l'autorité, et l'autorité engendre le respect – donc si vous voulez du respect dans un environnement sans ego, cultivez la connaissance.

8. **Battez-vous pour ce en quoi vous croyez, mais acceptez gracieusement la défaite.** Comprenez que parfois vos idées seront annulées. Même si vous avez raison, ne vous vengez pas et ne dites pas "Je vous l'avais dit" plus de quelques fois au maximum, et ne faites pas de votre idée chèrement disparue un martyr ou un cri de ralliement.

9. **Ne soyez pas "le gars dans la pièce".** Ne soyez pas le gars qui code dans le bureau sombre, n'émergeant que pour acheter du cola. Le gars dans la pièce est déconnecté, hors de vue et hors de contrôle et n'a pas sa place dans un environnement ouvert et collaboratif.

10. **Critiquez le code au lieu des personnes – soyez gentil avec le codeur, pas avec le code.** Autant que possible, rendez tous vos commentaires positifs et orientés vers l'amélioration du code. Reliez les commentaires aux standards locaux, aux spécifications du programme, à l'augmentation des performances, etc.

> **Source originale** : [The Ten Commandments of Egoless Programming](https://blog.codinghorror.com/the-ten-commandments-of-egoless-programming/) par Jeff Atwood, basé sur _The Psychology of Computer Programming_ de Jerry Weinberg (1971).

## Workflow de développement

### Travailler avec le monorepo

Ce projet est organisé comme un monorepo. Voir la section [Projets](#projets) pour la description détaillée des applications et bibliothèques.

### Modifier les bibliothèques partagées

**Important** : Lorsque vous modifiez du code dans `/libs`, vous devez exécuter `pnpm install` pour mettre à jour les dépendances pour `/apps`. Il n'est **pas nécessaire** d'exécuter `pnpm build` manuellement pour `/libs` car la construction se fait automatiquement.

```bash
# Après avoir modifié du code dans /libs
pnpm install
```

### Convention de nommage des branches

Utilisez des noms de branches descriptifs avec les modèles suivants :

- `feature/VG-123-description` - Nouvelles fonctionnalités (VG-123 = numéro de ticket)
- `fix/VG-123-description` - Corrections de bugs (VG-123 = numéro de ticket)
- `refactor/VG-123-description` - Refactorisation du code (VG-123 = numéro de ticket)
- `docs/VG-123-description` - Mises à jour de la documentation (VG-123 = numéro de ticket)
- `test/VG-123-description` - Ajouts ou mises à jour de tests (VG-123 = numéro de ticket)
- `chore/VG-123-description` - Tâches de maintenance (VG-123 = numéro de ticket)

**Exemples :**

- `feature/VG-42-add-poi-filtering`
- `fix/VG-15-map-marker-rendering`
- `refactor/VG-28-database-queries`

### Workflow quotidien

1. **Récupérer les derniers changements sur `main`**
2. **Créer une branche de fonctionnalité `feature/VG-123-description`**
3. **Effectuer vos modifications**
4. **Pousser votre branche**
5. **Ouvrir une Pull Request**

## Standards de code

### Principes généraux

- **Restez simple** : Privilégiez un code simple et lisible plutôt que des solutions ingénieuses
- **DRY (Don't Repeat Yourself)** : Extrayez la logique répétée dans des fonctions réutilisables
- **Séparation des préoccupations** : Gardez la logique métier, l'accès aux données et la présentation séparés

### Directives TypeScript

1. **Typage strict**
   - Évitez les types `any` - utilisez `unknown` si le type est vraiment inconnu

2. **Interfaces vs Types**
   - Utilisez `interface` autant que possible

3. **Conventions de nommage**
   - **Fichiers** : kebab-case (`user-service.ts`)
   - **Dossiers** : kebab-case (`poi-enrichment`)
   - **Classes** : PascalCase (`UserRepository`)
   - **Interfaces** : PascalCase (`IUserData` ou `UserData`)
   - **Fonctions/Variables** : camelCase (`getUserById`)
   - **Constantes** : UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
   - **Enums** : PascalCase avec valeurs UPPER_SNAKE_CASE

### Directives React & React Native

1. **Structure des composants**
   - Un composant par fichier
   - Utilisez des composants fonctionnels avec des hooks
   - Gardez les composants petits et ciblés (< 200 lignes)

2. **Optimisation React Compiler**
   - Le projet utilise React Compiler (`babel-plugin-react-compiler`)
   - **N'UTILISEZ PAS** manuellement `useMemo`, `useCallback`, ou `React.memo` sauf s'il y a un problème de performance spécifique
   - Laissez le compilateur gérer les optimisations automatiquement

3. **Hooks**
   - Extrayez la logique complexe dans des hooks personnalisés
   - Suivez la convention de nommage des hooks (`useCustomHook`)
   - Gardez les hooks purs et testables

4. **Props**
   - Définissez des types de props explicites
   - Déstructurez les props dans la signature de la fonction
   - Utilisez des valeurs par défaut lorsque c'est approprié

### Organisation des fichiers

À rédiger après concertation et refacto.

### ESLint et Prettier

- Tout le code doit passer les vérifications ESLint
- Utilisez Prettier pour le formatage
- Les hooks pre-commit exécuteront automatiquement les vérifications

### Gestion des erreurs

1. **Pour le backend**
   On devrait installer utiliser Effect https://effect.website/

2. **Pour React et React Native**
   On devrait utiliser des Error Boundaries.

## Directives de commit

### Format des messages de commit

Suivez la spécification [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Modifications de la documentation
- `style` : Changements de style de code (formatage, points-virgules manquants, etc.)
- `refactor` : Refactorisation du code
- `perf` : Améliorations de performance
- `test` : Ajout ou mise à jour de tests
- `chore` : Tâches de maintenance, mises à jour de dépendances
- `ci` : Modifications CI/CD

### Scope

Optionnel, spécifie la zone affectée :

- `api` : API backend
- `mobile` : Application mobile
- `scraper` : Data scraper
- `db` : Lié à la base de données
- `ui` : Interface utilisateur
- `deps` : Dépendances

### Exemples

```bash
feat(api): add endpoint for POI filtering by category

fix(mobile): resolve map marker rendering issue on iOS

docs: update CONTRIBUTING.md with code review guidelines

refactor(db): optimize POI queries using indexes

chore(deps): update typescript to 5.3.0
```

### Meilleures pratiques de commit

1. **Commits atomiques** : Chaque commit doit représenter un seul changement logique, séparez les changements backend, frontend, tests et autres dans des commits différents.
2. **Messages clairs** : Écrivez des messages de commit descriptifs
3. **Utilisez le présent** : "add feature" et non "added feature"

## Processus de Pull Request

### Titre et description de la PR

**Format du titre** : Identique aux messages de commit (`type(scope): description`)

**Template de description** :
cf le template de PR dans `.github/pull_request_template.md`

### Directives sur la taille des PR

- **Petite PR** (< 200 lignes) : Idéale, facile à revoir
- **PR moyenne** (200-500 lignes) : Acceptable, peut nécessiter plus de temps
- **Grande PR** (> 500 lignes) : Envisagez de diviser en plusieurs PRs

**Conseils pour garder les PRs petites** :

- Divisez les fonctionnalités en morceaux plus petits et indépendants
- Séparez la refactorisation du travail de fonctionnalité
- Utilisez des feature flags pour les fonctionnalités incomplètes

## Directives de revue de code

cf le template de revue de code dans `.github/pull_request_review_template.md`

#### Meilleures pratiques de revue

1. **Soyez respectueux et constructif**

   ```markdown
   # ❌ Mauvais

   Ce code est terrible.

   # ✅ Bon

   Envisagez d'extraire cette logique dans une fonction séparée pour une meilleure lisibilité.
   ```

2. **Expliquez le "pourquoi"**

   ```markdown
   # ❌ Mauvais

   N'utilisez pas `any` ici.

   # ✅ Bon

   L'utilisation de `any` contourne la vérification de type. Envisagez d'utiliser `unknown` et d'ajouter un garde-type,
   ce qui offre la sécurité de type tout en maintenant la flexibilité.
   ```

3. **Distinguer les retours critiques et optionnels**
   - **[critical]** : Doit être traité avant le merge
   - **[suggestion]** : Agréable à avoir, non bloquant
   - **[question]** : Demande de clarification
   - **[praise]** : Retour positif sur les bonnes pratiques

   ```markdown
   [critical] Cela causera une fuite mémoire car l'écouteur d'événement n'est jamais supprimé.

   [suggestion] Envisagez d'extraire cela dans un hook personnalisé pour la réutilisabilité.

   [question] Que se passe-t-il si l'API retourne null ici ?

   [praise] Excellente utilisation des unions discriminées TypeScript ici !
   ```

4. **Posez des questions au lieu de faire des demandes**

   ```markdown
   # ❌ Exigeant

   Déplacez cette logique dans un service.

   # ✅ Questionnant

   Avez-vous envisagé de déplacer cette logique dans un service ? Cela pourrait être plus facile à tester et réutiliser.
   ```

5. **Revoyez en temps opportun**
   - Essayez de revoir dans les 24 heures
   - Si vous ne pouvez pas revoir à temps, informez l'auteur

6. **Testez les changements**
   - Récupérez la branche et testez localement lorsque c'est possible
   - Vérifiez que la correction/fonctionnalité fonctionne comme prévu
   - Vérifiez les effets secondaires

### Fusion

- Utilisez **Squash and Merge** pour les branches de fonctionnalités
- Utilisez **Rebase and Merge** pour les commits propres et atomiques
- Supprimez la branche après la fusion

## Tests

À mettre en place après concertation et refacto.

## Documentation

### Documentation du code

- Ajoutez des commentaires inline pour la logique complexe
- Gardez les commentaires à jour avec les changements de code

### Fichiers README

- Chaque application et bibliothèque doit avoir un README
- Incluez les instructions de configuration, des exemples d'utilisation et la documentation de l'API
- Gardez les fichiers README à jour

## Structure du monorepo

### Gestion des packages

Ce projet utilise **pnpm workspaces**. La structure du workspace est définie dans `pnpm-workspace.yaml`.

Pour une description détaillée des applications et bibliothèques, consultez la section [Projets](#projets).

Pour les informations sur la modification des bibliothèques, voir la section [Modifier les bibliothèques partagées](#modifier-les-bibliothèques-partagées).

### Gestion des versions de dépendances

Utilisez `catalog:` pour les dépendances partagées afin de garder les versions cohérentes dans tout le monorepo. Vérifiez `package.json` pour les entrées de catalogue existantes.

---

Merci de contribuer à Vagabond ! 🚀
