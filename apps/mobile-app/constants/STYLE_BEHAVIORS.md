# Map Style Behaviors

_Dernière mise à jour : 16/02/2026_

Résumé des comportements de style des couches de la carte (boundaries, Voronoi).

## États des zones

| État           | Description                                               |
| -------------- | --------------------------------------------------------- |
| **unvisited**  | Aucun POI visité, aucune sous-zone complétée              |
| **inProgress** | Au moins un POI visité ou une sous-zone complétée         |
| **completed**  | Tous les POIs visités et toutes les sous-zones complétées |

---

## Boundaries (fog of war)

### Ordre de rendu

- **Entre niveaux** : NEIGHBORHOOD (fond) → DISTRICT → CITY → COUNTY → REGION → COUNTRY (premier plan). Les niveaux parents sont affichés au-dessus des enfants.
- **Au sein d’un niveau** : unvisited (fond) → inProgress → completed (premier plan).

Pour toutes les couches (sauf DISTRICT), la couleur des lignes varie selon le zoom (`step`) en fonction des seuils de visibilité des couches enfants définis dans `MapLayersConfig.ts` :

| Niveau   | Couleur Enfant (Zoom < Seuil) | Couleur Parent (Zoom >= Seuil) | Seuil (minZoom de l'enfant) |
| -------- | ----------------------------- | ------------------------------ | --------------------------- |
| COUNTRY  | Enfant                        | Parent                         | ~4 (REGION)                 |
| REGION   | Enfant                        | Parent                         | ~6 (COUNTY)                 |
| COUNTY   | Enfant                        | Parent                         | ~8 (CITY)                   |
| CITY     | Enfant                        | Parent                         | ~10 (VORONOI)               |
| DISTRICT | Enfant                        | —                              | —                           |

- **Enfant** : `fogOfWar.line.childColor`
- **Parent** : `fogOfWar.line.parentColor` (plus sombre)

### Opacités fill

| État       | Opacité |
| ---------- | ------- |
| unvisited  | 0.6     |
| inProgress | 0.25    |
| completed  | 0       |

### Couleurs fill

| État       | Couleur                         |
| ---------- | ------------------------------- |
| unvisited  | typography\["400"\] (gris)      |
| inProgress | typography\["400"\] (gris)      |
| completed  | primary\["100"\] (violet clair) |

### Couleurs lignes

| État       | Enfant (clair)      | Parent (foncé)      |
| ---------- | ------------------- | ------------------- |
| unvisited  | typography\["500"\] | typography\["700"\] |
| inProgress | typography\["500"\] | typography\["700"\] |
| completed  | primary\["300"\]    | primary\["500"\]    |

### Épaisseur des lignes

- **Toutes les couches** : 1.5 (fixe)

---

## Zones Voronoi (POI)

### Correspondance avec les boundaries

| Voronoi                    | Boundary            |
| -------------------------- | ------------------- |
| unvisited                  | unvisited           |
| completed (POI visité)     | completed           |
| selected (POI sélectionné) | — (état spécifique) |

### Couleurs

| État      | Fill                       | Line                       |
| --------- | -------------------------- | -------------------------- |
| unvisited | typography\["400"\] (gris) | typography\["500"\] (gris) |
| completed | transparent                | transparent                |
| selected  | secondary\["400"\] (coral) | secondary\["500"\] (coral) |

### Opacités

| État      | Fill | Line |
| --------- | ---- | ---- |
| unvisited | 0.6  | 1    |
| completed | 0    | 1    |
| selected  | 0.25 | 1    |

---

## Labels (BoundarySymbolLayers)

- **Texte** : typography\["0"\] (blanc)
- **Halo** : selon l’état (unvisited: typography\["600"\], inProgress: primary\["500"\], completed: primary\["400"\])

---

## Fichiers de référence

- `MapLayersStyles.ts` : constantes de style (centralisées dans `fogOfWar` et `voronoi`)
- `MapLayersConfig.ts` : structure des couches et plages de zoom (`layersInfos`)
- `zoneState.ts` : logique des états (unvisited, inProgress, completed)
- `useZoneCompletionData.ts` : hook centralisant les données de complétion par zone
- `BoundaryFilters.ts` : logique d'exclusion et de filtrage des couches (arrondissements, etc.)
- `BoundaryFillLayer.tsx`, `BoundaryLineLayer.tsx`, `BoundarySymbolLayers.tsx` : composants de rendu des couches de Fog of War
- `MapVoronoiLayers.tsx` : rendu des zones Voronoi (points d'intérêt)
