# Cache Intelligent des Places 🧠

## Vue d'ensemble

Le système de cache intelligent des places évite les requêtes API redondantes en gardant en mémoire toutes les zones géographiques (bounding boxes) déjà chargées. Quand une nouvelle zone est demandée, le système vérifie si elle est déjà contenue dans une zone précédemment chargée.

## Comment ça fonctionne

### 1. Détection des zones couvertes

- Chaque fois qu'une requête de places est faite, le système vérifie si la zone demandée est contenue dans une zone déjà en cache
- Si oui, les places sont filtrées depuis le cache local au lieu de faire un appel API
- Si non, une nouvelle requête API est effectuée et le résultat est mis en cache

### 2. Structure du cache

```typescript
// Chaque zone chargée est stockée avec sa bbox et ses données
interface CachedBoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  timestamp: number; // Pour un éventuel nettoyage futur
}
```

## Fichiers modifiés/créés

### Nouveaux fichiers :

- **`utils/placesCache.ts`** : Gestionnaire principal du cache
- **`hooks/other/usePlacesCache.ts`** : Hook utilitaire pour gérer le cache
- **`components/debug/PlacesCacheDebug.tsx`** : Composant de debug (optionnel)

### Fichiers modifiés :

- **`hooks/queries/usePlaces.ts`** : Intégration du cache intelligent
- **`utils/bbox.ts`** : Fonctions utilitaires pour les bounding boxes

## Utilisation

### Utilisation normale

Le cache fonctionne automatiquement, aucun changement requis dans le code existant :

```typescript
// Continue de fonctionner exactement comme avant
const { data: places } = usePlaces(boundingBox);
```

### Utilisation avancée (debug/gestion)

```typescript
import { usePlacesCache } from "@/hooks/other/usePlacesCache";

const { clearCache, getCacheInfo, isBboxCovered } = usePlacesCache();

// Vider le cache si nécessaire
clearCache();

// Obtenir des infos de debug
const info = getCacheInfo();
console.log(`Zones en cache: ${info.totalCachedAreas}`);

// Vérifier si une zone est couverte
const isCovered = isBboxCovered({
  minLat: 48.8,
  maxLat: 48.9,
  minLng: 2.3,
  maxLng: 2.4,
});
```

### Composant de debug (développement)

```typescript
import { PlacesCacheDebug } from "@/components/debug/PlacesCacheDebug";

// Ajouter temporairement dans votre composant pour déboguer
<PlacesCacheDebug />
```

## Avantages

1. **Performance** : Réduction drastique des appels API redondants
2. **Expérience utilisateur** : Chargement instantané pour les zones déjà visitées
3. **Économie de bande passante** : Moins de données transférées
4. **Compatibilité** : Fonctionne avec React Query sans conflit

## Configuration

### Paramètres ajustables dans `usePlaces` :

```typescript
staleTime: 1000 * 60 * 10, // 10 minutes (peut être ajusté)
```

### Paramètres dans `placesCache.ts` :

- Aucune configuration requise, le cache s'adapte automatiquement

## Logs de debug

Le système log automatiquement ses actions :

- `"Using cached places instead of API call"` : Cache utilisé
- `"No cache found, making API call"` : Nouvelle requête nécessaire
- `"Cached places for bbox"` : Nouvelles données mises en cache

## Notes techniques

- Le cache est en mémoire uniquement (disparaît au redémarrage de l'app)
- Les données sont filtrées géographiquement pour chaque requête
- Compatible avec le système React Query existant
- Pas d'impact sur la logique métier existante
