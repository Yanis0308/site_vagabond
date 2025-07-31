# ETL Scripts Structure

Ce dossier contient les scripts ETL pour l'importation des données OSM, organisés de manière modulaire pour améliorer la lisibilité et la maintenabilité.

## Structure des fichiers

### `import-pois.lua` (Fichier principal)

- Point d'entrée principal pour osm2pgsql
- Coordonne l'importation des POI et des frontières
- Contient les fonctions de traitement `osm2pgsql.process_*`

### `table-definitions.lua`

- Définit les structures des tables PostgreSQL
- Tables : `raw_pois` et `boundaries`
- Exporte les objets table via le module `M`

### `poi-filters.lua`

- Contient toute la logique de filtrage des POI
- Basé sur les critères de la requête Overpass V1
- Fonctions de filtrage séparées par type de tag (tourism, historic, etc.)
- Exporte la fonction principale `get_poi_data(tags)`

### `boundary-processor.lua`

- Traite les frontières administratives
- Prépare et insère les données de frontières
- Exporte la fonction `process_boundary(tables, object, geom)`

## Types de POI supportés

### Tourism

- `attraction` (avec wikidata + heritage 1-2)
- `zoo`, `monument`, `tower`, `aquarium`
- `museum`
- `information` (seulement si `information=office`)
- `artwork` (seulement si `artwork_type=statue` + wikidata)
- `viewpoint`

### Historic

- `castle`, `monument`, `memorial`, `yes` (avec wikidata)
- `city_gate`, `fort`, `citywalls` (avec wikidata)

### Building

- Bâtiments historiques (avec wikidata)
- Mémoriaux historiques

### Amenity

- `place_of_worship` (avec wikidata)
- `townhall`
- `theatre` (avec wikidata)

### Autres

- `bridge` (avec wikidata)
- `leisure=park` (avec wikidata)
- `leisure=marina`
- `government` (avec heritage ≤ 3)
- `landuse=cemetery` (avec wikidata)

## Usage

Le fichier principal `import-pois.lua` doit être utilisé avec osm2pgsql :

```bash
osm2pgsql -d database_name --style import-pois.lua data.osm.pbf
```

## Avantages de cette structure

1. **Lisibilité** : Chaque module a une responsabilité claire
2. **Maintenabilité** : Facile de modifier les filtres sans affecter le reste
3. **Testabilité** : Chaque module peut être testé indépendamment
4. **Réutilisabilité** : Les filtres peuvent être réutilisés dans d'autres contextes
