import {
  type BriefVisitedPoi,
  BriefVisitedPoiSchema,
} from "@vagabond/shared-utils";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Type } from "typebox";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  boundaries,
  type BoundaryLevelEnum,
  poiBoundaries,
  poiData,
  pois,
  visitedPois,
} from "../schema.js";
import { mapWithJsonSchema } from "../sqlMappers.js";

interface UserZoneStat {
  zone_id: string;
  name: string;
  boundary_level: BoundaryLevelEnum;
  parent_id: string | null;
  validated_pois_count: number;
  validated_pois: BriefVisitedPoi[];
  total_pois_count: number;
  total_subzones_count: number;
  completed_subzones_count: number;
}

export class BoundaryRepository {
  constructor(private readonly db: DrizzleClient) {}

  /**
   * Query numbering (see index comments in schema.ts):
   * - Query 1: recursive CTE `relevant_zones` (zone IDs from visits + parents).
   * - Query 2: main aggregated stats (`GROUP BY` boundary).
   *   - Subquery 2.1: `totalPoisSubquery` — COUNT(DISTINCT poi_id) on poi_boundaries by boundary_id (idx_poi_boundaries_boundary_id).
   *   - Subquery 2.2: `totalSubzonesSubquery` — direct child boundaries count.
   *   - Subquery 2.3: `completedSubzonesSubquery` — completed subzones in relevantZoneIds.
   *   - Subquery 2.4: scalar poi_data name — WHERE poi_id = … ORDER BY language DESC, id LIMIT 1 (idx_poi_data_poi_id_lang_id).
   */
  async findUserZoneStats(
    userId: string,
    boundaryLevels: BoundaryLevelEnum[] = [
      "COUNTRY",
      "REGION",
      "COUNTY",
      "CITY",
      "DISTRICT",
      "NEIGHBORHOOD",
    ],
  ): Promise<UserZoneStat[]> {
    // Query 1: relevant zone IDs (recursive CTE; raw SQL — Drizzle has no native recursive CTE support yet)
    const relevantZonesResult = await this.db.execute<{ zone_id: string }>(sql`
      WITH RECURSIVE relevant_zones AS (
        SELECT DISTINCT pb.boundary_id as zone_id
        FROM ${visitedPois} vp
        JOIN ${poiBoundaries} pb ON vp.poi_id = pb.poi_id
        WHERE vp.user_id = ${userId}
        
        UNION
        
        SELECT b.parent_id
        FROM relevant_zones rz
        JOIN ${boundaries} b ON rz.zone_id = b.id
        WHERE b.parent_id IS NOT NULL
      )
      SELECT zone_id FROM relevant_zones
    `);

    const relevantZoneIds = relevantZonesResult.rows.map((r) => r.zone_id);

    if (relevantZoneIds.length === 0) {
      return [];
    }

    // Query 2: stats for these zones (Drizzle). Subqueries 2.1–2.3 are correlated; 2.4 is inline in validated_pois.
    // Subquery 2.1: total POIs per zone (COUNT DISTINCT poi_id WHERE boundary_id = outer boundary)
    const totalPoisSubquery = this.db
      .select({
        count: sql`count(distinct ${poiBoundaries.poiId})`.mapWith(Number),
      })
      .from(poiBoundaries)
      .where(eq(poiBoundaries.boundaryId, boundaries.id));

    const b2 = alias(boundaries, "b2");
    // Subquery 2.2: count direct child boundaries
    const totalSubzonesSubquery = this.db
      .select({ count: count() })
      .from(b2)
      .where(eq(b2.parentId, boundaries.id));

    const b3 = alias(boundaries, "b3");
    // Subquery 2.3: child zones that appear in relevantZoneIds ("completed" subzones)
    const completedSubzonesSubquery = this.db
      .select({ count: count() })
      .from(b3)
      .where(
        and(eq(b3.parentId, boundaries.id), inArray(b3.id, relevantZoneIds)),
      );

    // Main SELECT for Query 2 (aggregates + embedded subqueries 2.1–2.4)
    const stats = await this.db
      .select({
        zone_id: boundaries.id,
        name: sql`COALESCE(${boundaries.name}, 'Unknown')`.mapWith(String),
        boundary_level: boundaries.boundaryLevel,
        parent_id: boundaries.parentId,
        validated_pois_count: sql`count(distinct ${visitedPois.poiId})`.mapWith(
          Number,
        ),
        validated_pois: sql`
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_strip_nulls(
                jsonb_build_object(
                  'id', ${visitedPois.id},
                  'poiId', ${visitedPois.poiId},
                  'name', (
                    -- Subquery 2.4: best display name per POI (idx_poi_data_poi_id_lang_id)
                    SELECT pd.name FROM ${poiData} pd 
                    WHERE pd.poi_id = ${visitedPois.poiId} 
                    ORDER BY pd.language DESC, pd.id LIMIT 1
                  ),
                  'coords', jsonb_build_object(
                    'latitude', ST_Y(${pois.coords}::geometry),
                    'longitude', ST_X(${pois.coords}::geometry)
                  ),
                  'createdAt', ${visitedPois.createdAt},
                  'comment', ${visitedPois.comment},
                  'rating', ${visitedPois.rating},
                  'imageKey', ${visitedPois.imageKey}
                )
              )
            ) FILTER (WHERE ${visitedPois.id} IS NOT NULL),
            '[]'::jsonb
          ) 
        `.mapWith(
          mapWithJsonSchema(
            Type.Array(BriefVisitedPoiSchema, {
              $id: "ValidatedPoisArray",
            }),
          ),
        ),
        total_pois_count: sql`COALESCE((${totalPoisSubquery}), 0)`.mapWith(
          Number,
        ),
        total_subzones_count:
          sql`COALESCE((${totalSubzonesSubquery}), 0)`.mapWith(Number),
        completed_subzones_count:
          sql`COALESCE((${completedSubzonesSubquery}), 0)`.mapWith(Number),
      })
      .from(boundaries)
      .leftJoin(poiBoundaries, eq(boundaries.id, poiBoundaries.boundaryId))
      .leftJoin(
        visitedPois,
        and(
          eq(poiBoundaries.poiId, visitedPois.poiId),
          eq(visitedPois.userId, userId),
        ),
      )
      .leftJoin(pois, eq(visitedPois.poiId, pois.id))
      .where(
        and(
          inArray(boundaries.id, relevantZoneIds),
          inArray(boundaries.boundaryLevel, boundaryLevels),
        ),
      )
      .groupBy(
        boundaries.id,
        boundaries.name,
        boundaries.boundaryLevel,
        boundaries.parentId,
      )
      .orderBy(
        sql`
        CASE ${boundaries.boundaryLevel}
          WHEN 'COUNTRY' THEN 1
          WHEN 'REGION' THEN 2  
          WHEN 'COUNTY' THEN 3
          WHEN 'CITY' THEN 4
          WHEN 'DISTRICT' THEN 5
          WHEN 'NEIGHBORHOOD' THEN 6
        END`,
        boundaries.name,
      );

    return stats;
  }
}
