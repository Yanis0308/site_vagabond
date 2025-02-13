# Data manager

## ETL

### Extract

`pnpm run extract`

### Transform

`pnpm run transform-and-load`

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
