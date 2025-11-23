import { and, count, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  boundaries,
  type BoundaryLevelEnum,
  type boundaryLevelEnum,
  poiBoundaries,
  poiData,
  visitedPois,
} from "../schema.js";

interface UserZoneStat {
  zone_id: string;
  name: string;
  boundary_level: BoundaryLevelEnum;
  parent_id: string | null;
  validated_pois_count: number;
  validated_pois: Array<{
    id: number;
    poiId: string;
    name: string;
    createdAt: string;
    comment: string | null;
    rating: number;
    imageKey: string;
  }>;
  total_pois_count: number;
  total_subzones_count: number;
  completed_subzones_count: number;
}

export class BoundaryRepository {
  constructor(private readonly db: DrizzleClient) {}

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
    // 1. Get relevant zone IDs using recursive CTE (raw SQL as Drizzle doesn't support recursive CTEs natively yet)
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

    // 2. Fetch stats for these zones using Drizzle Query Builder
    const totalPoisSubquery = this.db
      .select({ count: sql<number>`count(distinct ${poiBoundaries.poiId})` })
      .from(poiBoundaries)
      .where(eq(poiBoundaries.boundaryId, boundaries.id));

    const b2 = alias(boundaries, "b2");
    const totalSubzonesSubquery = this.db
      .select({ count: count() })
      .from(b2)
      .where(eq(b2.parentId, boundaries.id));

    const b3 = alias(boundaries, "b3");
    const completedSubzonesSubquery = this.db
      .select({ count: count() })
      .from(b3)
      .where(
        and(eq(b3.parentId, boundaries.id), inArray(b3.id, relevantZoneIds)),
      );

    const stats = await this.db
      .select({
        zone_id: boundaries.id,
        name: boundaries.name,
        boundary_level: boundaries.boundaryLevel,
        parent_id: boundaries.parentId,
        validated_pois_count: sql<number>`count(distinct ${visitedPois.poiId})`,
        validated_pois: sql<UserZoneStat["validated_pois"]>`
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_strip_nulls(
                jsonb_build_object(
                  'id', ${visitedPois.id},
                  'poiId', ${visitedPois.poiId},
                  'name', (
                    SELECT pd.name FROM ${poiData} pd 
                    WHERE pd.poi_id = ${visitedPois.poiId} 
                    ORDER BY pd.language DESC, pd.id LIMIT 1
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
        `,
        total_pois_count: sql<number>`COALESCE((${totalPoisSubquery}), 0)`,
        total_subzones_count: sql<number>`COALESCE((${totalSubzonesSubquery}), 0)`,
        completed_subzones_count: sql<number>`COALESCE((${completedSubzonesSubquery}), 0)`,
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

    return stats.map((stat) => ({
      zone_id: stat.zone_id,
      name: stat.name ?? "Unknown",
      boundary_level: stat.boundary_level,
      parent_id: stat.parent_id,
      validated_pois_count: Number(stat.validated_pois_count),
      validated_pois: stat.validated_pois,
      total_pois_count: Number(stat.total_pois_count),
      total_subzones_count: Number(stat.total_subzones_count),
      completed_subzones_count: Number(stat.completed_subzones_count),
    }));
  }
}
