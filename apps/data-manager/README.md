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
        ├── boundaries-country.jsonl
        ├── boundaries-region.jsonl
        ├── boundaries-county.jsonl
        ├── boundaries-city.jsonl
        ├── boundaries-district.jsonl
        └── boundaries-neighborhood.jsonl
```

## Utilisation

### 1. Extract

Extraction depuis fichier PBF OpenStreetMap vers PostgreSQL :

```bash
pnpm run extract france-2024-01-15.osm.pbf
```

Le script crée automatiquement le schéma et exécute osm2pgsql.

### 2. Transform

Transformation des données PostgreSQL vers fichiers JSONL :

```bash
pnpm run transform --schema=france_2024_01_15 --country=FR
```

Génère un dossier `output/schema_country_timestamp/` avec sous-dossiers `db/` et `geojson/`.

### 3. Load Database

Chargement des fichiers JSONL en base de données :

```bash
pnpm run load-db --transform-dir=france_2024_01_15_2025-01-01-12-00-00
```

**Obligatoire :** `--transform-dir` doit pointer vers un dossier existant dans `output/`.

### 4. Load Mapbox

Upload vers Mapbox Tileset :

```bash
pnpm run load-mapbox --transform-dir=france_2024_01_15_2025-01-01-12-00-00
```

**Obligatoire :** `--transform-dir` doit pointer vers un dossier existant dans `output/`.

**Prérequis :**

- Variables d'environnement : `MAPBOX_ACCESS_TOKEN`, `MAPBOX_USERNAME`
- Installation : `pip install tilesets`

## Scripts disponibles

- `pnpm run extract <fichier.pbf>` - Extraction PBF → PostgreSQL
- `pnpm run transform` - PostgreSQL → JSONL
- `pnpm run load-db` - JSONL → Base de données
- `pnpm run load-mapbox` - JSONL → Mapbox Tileset

## Configuration

### Variables d'environnement

```bash
DATABASE_URL=postgresql://user:password@localhost:5442/vagabond-data-manager
MAPBOX_ACCESS_TOKEN=your_token
MAPBOX_USERNAME=your_username
```

### Mapbox Tileset

Les fichiers GeoJSON sont organisés par niveau administratif avec optimisation zoom :

- **Country** (zoom 0-5)
- **Region** (zoom 6-10)
- **County** (zoom 7-10)
- **City** (zoom 8-11)
- **District** (zoom 9-12)
- **Neighborhood** (zoom 10-16)
