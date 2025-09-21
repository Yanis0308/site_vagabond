# Data manager

## ETL

### Extract

#### Extraction par fichier PBF

Vous pouvez maintenant extraire les données pour un fichier PBF spécifique en utilisant le nom complet du fichier :

```bash
pnpm run extract france-2024-01-15.osm.pbf
pnpm run extract belgium-2024-12-01.osm.pbf
pnpm run extract netherlands-2024-11-15.osm.pbf
```

Le script va automatiquement :

- Vérifier que le fichier PBF existe dans `src/etl/extract/pbf-files/`
- Créer un schéma de base de données avec le nom du fichier (sans l'extension `.osm.pbf`)
- Afficher la commande osm2pgsql complète à copier-coller

**Note**: Le script n'exécute plus automatiquement la commande osm2pgsql. Il affiche la commande formatée que vous devez copier et exécuter manuellement.

#### Extraction classique

`pnpm run extract` (utilise le fichier PBF codé en dur)

### Transform and Load

Transforme et charge les données dans la base de données principale. Le nom du schéma est **obligatoire**.

```bash
# Usage obligatoire avec un nom de schéma
pnpm run transform-and-load belgium_2024_12_01
```

Le script va automatiquement :

- Valider que le nom du schéma est fourni (argument obligatoire)
- Utiliser le schéma spécifié dans les requêtes SQL (ex: `belgium-2025.raw_pois`)
- Traiter les données par lots pour l'optimisation des performances
- Charger les données dans la base de données principale via Prisma

**Note**: Si aucun argument n'est fourni, le script affichera un message d'erreur avec l'usage correct.

### Load

- automatically done by the transform script

## CLI Examples

### osm2pgsql

- Doc https://osm2pgsql.org/doc/manual.html

Semble plus lent en mode slim ?

- On peut remplacer "--create" par "--append" pour ne pas supprimer les tables existantes

```bash
osm2pgsql --database=vagabond-data-manager --user=user --password --host=localhost --port=5442 --slim --create --output=flex --style=import-pois.lua pbf-files/nord-pas-de-calais-latest.osm.pbf
```

### ogr2ogr

```bash
OGR_GEOJSON_MAX_OBJ_SIZE=0 ogr2ogr -f "PostgreSQL" "postgresql://user:password@localhost:5442/vagabond-data-manager" "OSM Boundaries-with-admin-level.geojson" -nln osm_boundaries_import -append
```

## SQL requests

### Get all pois intersecting with boundaries

```sql
SELECT p.name, b.name, b.admin_level, p.tags, b.tags
FROM pois as p
JOIN boundaries as b
ON ST_Intersects(p.geom, b.geom)
where p.name is not null
and b.name is not null
and b.admin_level = '8'
--and b.name = 'Lille'
```

### Get all pois with their boundaries as JSON

```sql
SELECT jsonb_agg(
  jsonb_build_object(
    'osm_id', p.osm_id,
    'poi_name', p.name,
    'poi_tags', p.tags,
    'coordinates', jsonb_build_object(
      'latitude', ST_Y(ST_Transform(p.geom, 4326)),
      'longitude', ST_X(ST_Transform(p.geom, 4326))
    ),
    'boundaries', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'osm_id', b.osm_id,
          'boundary_name', b.name,
          'admin_level', b.admin_level,
          'boundary_tags', b.tags
        )
      )
      FROM boundaries b
      WHERE ST_Intersects(p.geom, b.geom) AND b.name IS NOT NULL
    )
  )
)
FROM pois p
WHERE p.name IS NOT NULL;
```

### Get all subclasss unique values

```sql
SELECT subclass, COUNT(*) as count
FROM pois
GROUP BY subclass
ORDER BY count DESC;
```
