"use server";

import postgres from "postgres";

import { type RawPoi } from "@/app/pois/types";

const sql = postgres(process.env.DATABASE_URL ?? "");

export async function selectAllPoisByTags(): Promise<
  postgres.RowList<RawPoi[]>
> {
  console.time("selectAllPoisByTags");

  const query = sql`
    SELECT 
      p.osm_type,
      p.osm_id,
      p.name,
      ST_X(ST_Transform(p.geom, 4326)) as longitude,
      ST_Y(ST_Transform(p.geom, 4326)) as latitude,
      p.tags
    FROM raw_pois p
    WHERE
    (osm_type <> 'R')
    AND (p.name IS NOT NULL OR p.name <> '' OR p.tags->>'wikidata' IS NOT NULL OR p.tags->>'wikipedia' IS NOT NULL)
    AND (
      (p.tags->>'leisure' = 'park')
      OR (
        (p.tags->>'tourism' IN ('attraction', 'museum', 'zoo', 'monument', 'artwork'))
        OR p.tags->>'wikidata' IS NOT NULL 
        OR p.tags->>'wikipedia' IS NOT NULL
      )
      OR (
        (p.tags->>'historic' IN ('memorial', 'yes', 'castle', 'monument'))
        OR p.tags->>'wikidata' IS NOT NULL 
        OR p.tags->>'wikipedia' IS NOT NULL
      )
      OR (p.tags->>'amenity' = 'place_of_worship')
    )
  `;

  const pois = await query;

  console.timeEnd("selectAllPoisByTags");
  console.log(`Retrieved ${pois.length} POIs`);

  return pois as postgres.RowList<RawPoi[]>;
}

export async function selectAllPoisWithBoundaries(): Promise<
  postgres.RowList<RawPoi[]>
> {
  console.time("selectAllPois");

  const query = sql`
    SELECT 
      p.osm_type,
      p.osm_id,
      p.name,
      p.class,
      p.subclass,
      ST_X(ST_Transform(p.geom, 4326)) as longitude,
      ST_Y(ST_Transform(p.geom, 4326)) as latitude,
      p.tags,
      jsonb_agg(
        jsonb_build_object(
          'osm_type', b.osm_type,
          'osm_id', b.osm_id,
          'name', b.name,
          'admin_level', b.admin_level,
          'tags', b.tags
        )
      ) as boundaries
    FROM raw_pois p
    LEFT JOIN boundaries b ON ST_Intersects(p.geom, b.geom)
    GROUP BY p.osm_type, p.osm_id, p.name, p.class, p.subclass, p.geom, p.tags
    LIMIT 10000
  `;

  console.log("Executing query:", query.toString());

  const pois = await query;

  console.timeEnd("selectAllPois");
  console.log(`Retrieved ${pois.length} POIs`);

  return pois as postgres.RowList<RawPoi[]>;
}
