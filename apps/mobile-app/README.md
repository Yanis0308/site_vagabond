# Mobile App Vagabond

Application mobile React Native avec **Expo** et **Expo Router**. Utilise **NativeWind** (Tailwind CSS), **React Query**, **Mapbox**, **Firebase Auth**, **Jotai** pour l'état global, et **i18next** pour l'internationalisation. Supporte iOS et Android avec builds via EAS (Expo Application Services).

## Technologies principales

- **React Native** - Framework mobile cross-platform
- **Expo** - Plateforme de développement React Native
- **Expo Router** - Navigation basée sur le système de fichiers
- **TypeScript** - Typage statique
- **NativeWind** - Tailwind CSS pour React Native
- **React Query** - Gestion des données serveur avec cache et synchronisation
- **Mapbox** - Cartes interactives
- **Firebase Auth** - Authentification (Google, Apple)
- **Jotai** - Gestion d'état atomique
- **i18next** - Internationalisation (FR, EN)
- **Gluestack UI** - Composants UI
- **React Compiler** - Optimisations automatiques React

## Architecture

```
apps/mobile-app/
├── app/                           # Routes Expo Router (file-based routing)
│   ├── _layout.tsx                # Layout racine
│   ├── (app)/                     # Routes protégées (nécessitent authentification)
│   │   ├── (tabs)/                # Navigation par onglets
│   │   │   ├── index.tsx         # Carte principale
│   │   │   ├── leaderboard.tsx   # Classement
│   │   │   └── profile.tsx       # Profil utilisateur
│   │   ├── search.tsx            # Recherche
│   │   └── validate-place/       # Validation de lieux
│   └── sign-in.tsx               # Page de connexion
├── components/                    # Composants réutilisables
│   ├── ui/                       # Composants UI Gluestack
│   ├── custom-ui/                # Composants personnalisés
│   └── ...                       # Autres composants
├── hooks/                        # Hooks personnalisés
│   ├── queries/                  # Hooks React Query
│   ├── mutations/                # Hooks de mutations
│   └── other/                    # Autres hooks
├── http/                         # Clients HTTP
│   ├── api-client.ts             # Client API principal
│   └── ...                       # Clients spécifiques
├── stores/                       # Stores Jotai (état global)
├── services/                     # Services métier
├── constants/                    # Constantes et configuration
├── localization/                 # Traductions i18next
└── utils/                        # Utilitaires
```

### Navigation

L'application utilise **Expo Router** avec un système de routes basé sur les fichiers :

- Routes protégées : `app/(app)/*` - Nécessitent une authentification
- Routes publiques : `app/sign-in.tsx` - Accessibles sans authentification
- Navigation par onglets : `app/(app)/(tabs)/*` - Navigation principale

### Gestion d'état

- **Jotai** - État global atomique (utilisateur authentifié, recherches récentes, etc.)
- **React Query** - État serveur avec cache, synchronisation et persistence
- **Local Storage** - Persistence des données React Query via AsyncStorage

### Authentification

- **Firebase Auth** - Authentification via Google et Apple
- Gestion de l'état d'authentification via `authenticatedUserAtom` (Jotai)
- Protection des routes via `Stack.Protected` dans le layout

## Installation

```bash
# Depuis la racine du monorepo
pnpm install

# Depuis le dossier de l'app mobile
cd apps/mobile-app
pnpm install
```

## Configuration

### Gestion des environnements

L'application utilise trois fichiers d'environnement selon le contexte :

- **`.env.local`** - Configuration pour le développement local et les builds de développement
- **`.env.dev`** - Configuration pour l'environnement de développement (utilisé avec `.env.local` pour les builds preview)
- **`.env.prd`** - Configuration pour l'environnement de production

> **Note importante** : Les builds **preview** correspondent à l'environnement **DEV**. Ils utilisent `.env.local` et `.env.dev` (avec surcharge via `--overload`).

### Variables d'environnement

Créez les fichiers d'environnement à la racine de `apps/mobile-app/` :

> **Astuce** : Vous pouvez copier `.env.example` vers `.env.local` comme point de départ :
>
> ```bash
> cp .env.example .env.local
> ```
>
> Puis remplissez les valeurs avec vos propres credentials.

### Utilisation des fichiers d'environnement

Les scripts utilisent automatiquement les bons fichiers selon le contexte :

- **Développement local** : `pnpm develop` → utilise `.env.local`
- **Builds development** : `pnpm build-cloud-ios-dev` → utilise `.env.local`
- **Builds preview (DEV)** : `pnpm build-cloud-ios-preview` → utilise `.env.local` + `.env.dev` (surcharge)
- **Builds production** : `pnpm build-cloud-ios-prd` → utilise `.env.prd`

### Firebase

1. Téléchargez les fichiers `GoogleService-Info.plist` (iOS) et `google-services.json` (Android) depuis la console Firebase
2. Placez-les dans `./firebase/dev/` (pour développement) ou `./firebase/prd/` (pour production)
3. Configurez les chemins dans vos fichiers d'environnement (voir `.env.example` pour la structure)
4. Pour les builds locaux, décommentez le dossier `firebase/` dans `.gitignore` si nécessaire

### Mapbox

1. Créez un compte Mapbox et obtenez vos tokens
2. Configurez les tilesets pour les boundaries et POIs
3. Ajoutez les tokens dans les variables d'environnement

## Scripts disponibles

### Développement

```bash
# Démarrer le serveur de développement
pnpm develop

# Vérifier la configuration Expo
pnpx expo-doctor@latest
```

### Builds iOS

```bash
# Simulateur (local) - utilise .env.local
pnpm build-local-ios-simulator

# Simulateur (cloud) - utilise .env.local
pnpm build-cloud-ios-simulator

# Development build (local) - utilise .env.local
pnpm build-local-ios-dev

# Development build (cloud) - utilise .env.local
pnpm build-cloud-ios-dev

# Preview build (local) - utilise .env.local + .env.dev (DEV)
pnpm build-local-ios-preview

# Preview build (cloud) - utilise .env.local + .env.dev (DEV)
pnpm build-cloud-ios-preview

# Production build (local) - utilise .env.prd
pnpm build-local-ios-prd

# Production build (cloud) - utilise .env.prd
pnpm build-cloud-ios-prd
```

### Builds Android

```bash
# Development build (local) - utilise .env.local
pnpm build-local-android-dev

# Development build (cloud) - utilise .env.local
pnpm build-cloud-android-dev

# Preview build (local) - utilise .env.local + .env.dev (DEV)
pnpm build-local-android-preview

# Preview build (cloud) - utilise .env.local + .env.dev (DEV)
pnpm build-cloud-android-preview

# Production build (local) - utilise .env.prd
pnpm build-local-android-prd

# Production build (cloud) - utilise .env.prd
pnpm build-cloud-android-prd
```

### Soumission aux stores

```bash
# iOS Preview
pnpm submit-ios-preview

# iOS Production
pnpm submit-ios-prd

# Android Preview
pnpm submit-android-preview

# Android Production
pnpm submit-android-prd
```

### OTA Updates (Over-The-Air)

```bash
# Preview environment (DEV) - utilise .env.local + .env.dev
pnpm create-update-preview -- --message "Your update message"

# Production environment - utilise .env.prd
pnpm create-update-prd -- --message "Your update message"
```

Les mises à jour OTA permettent de mettre à jour l'application sans passer par les stores.

> **Note** : Les mises à jour preview correspondent à l'environnement DEV et utilisent les fichiers `.env.local` et `.env.dev`.

## Fonctionnalités principales

### Carte interactive

- Affichage des POIs sur une carte Mapbox
- Clustering des points pour de meilleures performances
- Recherche de POIs et villes
- Affichage des boundaries (frontières administratives)
- Navigation vers les détails d'un POI

### Recherche

- Recherche de POIs et villes
- Historique des recherches récentes
- Suggestions automatiques

### Validation de lieux

- Upload de photos pour valider un lieu
- Formulaire de validation avec détails
- Enrichissement automatique des données

### Profil utilisateur

- Affichage des statistiques (POIs visités, zones explorées)
- Classement personnel
- Gestion du compte

### Classement

- Classement global et mensuel
- Affichage des utilisateurs les plus actifs

## Structure des composants

### Composants UI

Les composants UI utilisent **Gluestack UI** avec **NativeWind** pour le styling :

- Composants de base : Button, Input, Text, etc.
- Composants personnalisés : CustomMapView, PlaceDetails, etc.

### Hooks personnalisés

- **Queries** : `usePoiEnriched`, `useSearch`, `useLeaderboard`, etc.
- **Mutations** : `useValidatePlaceMutation`, `useUploadFileMutation`, etc.
- **Other** : `useMapLogic`, `usePlaceSelection`, `useZoneHierarchy`, etc.

### Clients HTTP

- `api-client.ts` - Client API principal avec authentification
- Clients spécifiques : `pois.ts`, `search.ts`, `users.ts`, etc.

## Internationalisation

L'application supporte le français et l'anglais via **i18next** :

```typescript
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
const text = t("common.welcome");
```

Les traductions sont dans `localization/locales/{lang}/common.json`.

## Optimisations

### React Compiler

L'application utilise **React Compiler** pour optimiser automatiquement les composants :

- **N'utilisez PAS** manuellement `useMemo`, `useCallback`, ou `React.memo`
- Le compilateur gère les optimisations automatiquement
- Utilisez ces hooks uniquement en cas de problème de performance spécifique

### Performance

- **FlashList** - Liste performante pour les grandes listes
- **React Query** - Cache et synchronisation intelligente
- **Clustering Mapbox** - Clustering des points sur la carte
- **Image optimization** - Compression et optimisation des images

## Développement

### Structure des routes

Les routes suivent la structure de fichiers d'Expo Router :

- `app/(app)/(tabs)/index.tsx` → `/` (carte)
- `app/(app)/(tabs)/leaderboard.tsx` → `/leaderboard`
- `app/(app)/(tabs)/profile.tsx` → `/profile`
- `app/(app)/search.tsx` → `/search`

### Ajout d'une nouvelle route

1. Créer un fichier dans `app/` ou `app/(app)/`
2. Exporter un composant React par défaut
3. La route sera automatiquement disponible

### Ajout d'un hook React Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/http/api-client";

export function useMyData() {
  return useQuery({
    queryKey: ["my-data"],
    queryFn: async () => {
      const response = await apiClient.get("/api/my-endpoint");
      return response.data;
    },
  });
}
```

### Utilisation de Jotai

```typescript
import { useAtom } from "jotai";
import { myAtom } from "@/stores/myAtom";

export function MyComponent() {
  const [value, setValue] = useAtom(myAtom);
  // ...
}
```

## Vérifications

```bash
# TypeScript
pnpm typescript-check

# ESLint
pnpm lint-check

# Prettier
pnpm prettier-check
```

## Notes importantes

### Box-shadow dans NativeWind

Le support natif des box-shadow n'est pas encore disponible dans NativeWind. Utilisez `StyleSheet` de React Native pour créer des ombres :

```typescript
import { StyleSheet } from "react-native";

const shadowStyles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
```

### Configuration Metro

- `inlineRem` est désactivé dans `metro.config.js` pour utiliser 16px comme taille de police de base

### Issue Gluestack UI

Nous suivons cette issue concernant un problème de typage dans Gluestack UI : https://github.com/gluestack/gluestack-ui/issues/2898

## Ressources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Query](https://tanstack.com/query/latest)
- [NativeWind](https://www.nativewind.dev/)
- [Mapbox React Native](https://github.com/rnmapbox/maps)
- [Jotai](https://jotai.org/)
