# Data Manager

ETL pour traiter les données OpenStreetMap et les préparer pour l'API et Mapbox.

## Architecture

```
output/
└── schema_countryCode_YYYY-MM-DD-HH-mm-ss/
    ├── db/                    # Données pour la base
    │   ├── pois.jsonl
    │   ├── boundaries.jsonl
    │   ├── associations.jsonl
    │   └── hierarchies.jsonl
    └── geojson/              # Données pour Mapbox
        ├── pois.jsonl
        ├── boundaries-country.jsonl
        ├── boundaries-region.jsonl
        ├── boundaries-county.jsonl
        ├── boundaries-city.jsonl
        ├── boundaries-district.jsonl
        ├── boundaries-neighborhood.jsonl
        ├── boundaries-polygons-country.jsonl
        ├── boundaries-polygons-region.jsonl
        ├── boundaries-polygons-county.jsonl
        ├── boundaries-polygons-city.jsonl
        ├── boundaries-polygons-district.jsonl
        └── boundaries-polygons-neighborhood.jsonl
```

## Utilisation

### 1. Extract

Extraction depuis fichier PBF OpenStreetMap vers PostgreSQL :

- renommer le fichier PBF en <pays>-<annee>-<mois>-<jour>.osm.pbf et le placer dans le dossier src/etl/extract/pbf-files/

```bash
pnpm run extract france-2024-01-15.osm.pbf
```

Le script crée automatiquement le schéma et exécute osm2pgsql.

### 2. Transform

Transformation des données PostgreSQL vers fichiers JSONL :

- un nouveau schema en bdd a été créé automatiquement avec le nom du pays et la date d'extraction
- ⚠️ le schema comporte des underscore \_ au lieu de tirets -

```bash
# Transformation complète (crée un nouveau dossier output)
pnpm run transform --schema=france_2024_01_15 --country=FR

# Regénérer uniquement les zones Voronoi (réutilise un dossier existant, écrase voronoi-zones.jsonl)
pnpm run transform --schema=france_2024_01_15 --country=FR --voronoi-only --transform-dir=france_2024_01_15_FR_2025-01-01-12-00-00
```

Génère un dossier `output/schema_country_timestamp/` avec sous-dossiers `db/` et `geojson/`.

### 3. Load Database

Chargement des fichiers JSONL en base de données :

```bash
pnpm run load-db -- --transform-dir france_2024_01_15_2025-01-01-12-00-00
```

**Obligatoire :** `--transform-dir` doit pointer vers un dossier existant dans `output/`.

### 4. Load Mapbox Boundaries

Upload des boundaries vers Mapbox Tileset :

```bash
pnpm run load-mapbox-boundaries --transform-dir=france_2024_01_15_2025-01-01-12-00-00
```

### 5. Load Mapbox POIs

Upload des POI vers Mapbox Tileset :

```bash
pnpm run load-mapbox-pois --transform-dir=france_2024_01_15_2025-01-01-12-00-00
```

**Obligatoire :** `--transform-dir` doit pointer vers un dossier existant dans `output/`.

**Prérequis :**

- Variables d'environnement : `MAPBOX_ACCESS_TOKEN`, `MAPBOX_USERNAME`
- Installation : `pip install tilesets`

## Scripts disponibles

### Vérifications

- `pnpm typescript-check` - Vérification TypeScript
- `pnpm lint-check` - Vérification ESLint
- `pnpm lint-fix` - Correction automatique ESLint
- `pnpm prettier-check` - Vérification Prettier
- `pnpm prettier-fix` - Correction automatique Prettier

### ETL

- `pnpm run extract <fichier.pbf>` - Extraction PBF → PostgreSQL data-manager
- `pnpm run transform` - PostgreSQL data-manager → JSONL (génère POI et boundaries)
- `pnpm run load-db` - JSONL → PostgreSQL API
- `pnpm run load-mapbox-boundaries` - JSONL boundaries → Mapbox Tileset
- `pnpm run load-mapbox-pois` - JSONL POI → Mapbox Tileset

## Nettoyage des données

Pour réimporter les données depuis le début, truncate les tables dans cet ordre :

```sql
-- 1. Supprimer les associations
TRUNCATE TABLE "poi_boundaries" CASCADE;

-- 2. Supprimer les POI data
TRUNCATE TABLE "poi_data" CASCADE;

-- 3. Supprimer les POI
TRUNCATE TABLE "pois" CASCADE;

-- 4. Supprimer les boundaries
TRUNCATE TABLE "boundaries" CASCADE;
```

Puis relancer `pnpm run load-db`.

## Configuration

### Variables d'environnement

```bash
DATABASE_URL=postgresql://user:password@localhost:5442/vagabond-data-manager
MAPBOX_ACCESS_TOKEN=your_token
MAPBOX_USERNAME=your_username
```

### Mapbox Tilesets

**Boundaries** - organisés par niveau administratif avec optimisation zoom :

- **Country** (zoom 0-10)
- **Region** (zoom 3-10)
- **County** (zoom 3-10)
- **City** (zoom 6-10)
- **District** (zoom 7-10)
- **Neighborhood** (zoom 9-10)

**POIs** - points d'intérêt (zoom 10-10) :

- Properties : `poiId`, `name`, `filterLevel` (UNKNOWN, STRICT, STANDARD, INTERMEDIATE, LAXIST)
