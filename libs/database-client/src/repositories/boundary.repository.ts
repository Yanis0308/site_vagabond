import { type BriefVisitedPoi } from "@vagabond/shared-utils";
import { and, count, countDistinct, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  boundaries,
  type BoundaryLevelEnum,
  poiBoundaries,
  poiData,
  pois,
  visitedPois,
} from "../schema.js";
import { mapWithNullableString } from "../sqlMappers.js";

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
   * Decomposes the query into 4 focused queries + TypeScript assembly:
   * - Recursive CTE: relevant zone IDs
   * - Query A: visited POIs with names & coords (raw SQL — PostGIS + scalar subquery)
   * - Query B: total POIs per zone (Drizzle)
   * - Query C: subzone counts total + completed (Drizzle + raw SQL for FILTER)
   * - Query D: boundary info filtered by levels (Drizzle)
   * Queries A–D run in parallel via Promise.all.
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
    includeValidatedPois = true,
  ): Promise<UserZoneStat[]> {
    // Recursive CTE: relevant zone IDs (raw SQL — Drizzle has no recursive CTE support)
    const relevantZonesResult = await this.db.execute(sql`
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

    const relevantZoneIds = (
      relevantZonesResult.rows as Array<{ zone_id: string }>
    ).map((r) => r.zone_id);

    if (relevantZoneIds.length === 0) {
      return [];
    }

    const b2 = alias(boundaries, "b2");

    // Query A (full): visited POIs with names, coords, and boundary associations
    const queryAFull = includeValidatedPois
      ? this.db
          .select({
            id: visitedPois.id,
            poiId: visitedPois.poiId,
            createdAt: visitedPois.createdAt,
            comment: visitedPois.comment,
            rating: visitedPois.rating,
            imageKey: visitedPois.imageKey,
            latitude: sql`ST_Y(${pois.coords}::geometry)`.mapWith(Number),
            longitude: sql`ST_X(${pois.coords}::geometry)`.mapWith(Number),
            boundaryId: poiBoundaries.boundaryId,
            name: sql`(
              SELECT pd.name FROM ${poiData} pd
              WHERE pd.poi_id = ${visitedPois.poiId}
              ORDER BY pd.language DESC, pd.id LIMIT 1
            )`.mapWith(mapWithNullableString),
          })
          .from(visitedPois)
          .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, visitedPois.poiId))
          .innerJoin(pois, eq(pois.id, visitedPois.poiId))
          .where(
            and(
              eq(visitedPois.userId, userId),
              inArray(poiBoundaries.boundaryId, relevantZoneIds),
            ),
          )
      : null;

    // Query A' (count-only): distinct visited POIs count per boundary — no PostGIS, no name subquery
    const queryACount = !includeValidatedPois
      ? this.db
          .select({
            boundaryId: poiBoundaries.boundaryId,
            count: countDistinct(visitedPois.poiId).mapWith(Number),
          })
          .from(visitedPois)
          .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, visitedPois.poiId))
          .where(
            and(
              eq(visitedPois.userId, userId),
              inArray(poiBoundaries.boundaryId, relevantZoneIds),
            ),
          )
          .groupBy(poiBoundaries.boundaryId)
      : null;

    // Run queries in parallel (Query A xor A' depending on includeValidatedPois)
    const [
      visitedPoisRows,
      visitedCountRows,
      boundaryInfoRows,
      totalPoisRows,
      subzonesRows,
    ] = await Promise.all([
      queryAFull ?? Promise.resolve([]),
      queryACount ?? Promise.resolve([]),

      // Query D: boundary info filtered by levels (Drizzle)
      this.db
        .select({
          id: boundaries.id,
          name: sql`COALESCE(${boundaries.name}, 'Unknown')`.mapWith(String),
          boundary_level: boundaries.boundaryLevel,
          parent_id: boundaries.parentId,
        })
        .from(boundaries)
        .where(
          and(
            inArray(boundaries.id, relevantZoneIds),
            inArray(boundaries.boundaryLevel, boundaryLevels),
          ),
        ),

      // Query B: total POIs count per zone (Drizzle)
      this.db
        .select({
          boundaryId: poiBoundaries.boundaryId,
          totalPois: countDistinct(poiBoundaries.poiId).mapWith(Number),
        })
        .from(poiBoundaries)
        .where(inArray(poiBoundaries.boundaryId, relevantZoneIds))
        .groupBy(poiBoundaries.boundaryId),

      // Query C: subzone counts — total + completed (Drizzle + raw SQL for FILTER)
      this.db
        .select({
          parentId: b2.parentId,
          totalSubzones: count().mapWith(Number),
          completedSubzones:
            sql`COUNT(*) FILTER (WHERE ${inArray(b2.id, relevantZoneIds)})`.mapWith(
              Number,
            ),
        })
        .from(b2)
        .where(inArray(b2.parentId, relevantZoneIds))
        .groupBy(b2.parentId),
    ]);

    // Build lookup maps for O(n) assembly
    const totalPoisMap = new Map<string, number>();
    for (const row of totalPoisRows) {
      totalPoisMap.set(row.boundaryId, row.totalPois);
    }

    const subzonesMap = new Map<string, { total: number; completed: number }>();
    for (const row of subzonesRows) {
      if (row.parentId !== null) {
        subzonesMap.set(row.parentId, {
          total: row.totalSubzones,
          completed: row.completedSubzones,
        });
      }
    }

    // Count-only map (used when includeValidatedPois = false)
    const validatedCountMap = new Map<string, number>();
    for (const row of visitedCountRows) {
      validatedCountMap.set(row.boundaryId, row.count);
    }

    // Group visited POIs by boundary, deduplicating by visited_poi id
    const poisByBoundary = new Map<string, Map<number, BriefVisitedPoi>>();
    for (const row of visitedPoisRows) {
      let boundaryPois = poisByBoundary.get(row.boundaryId);
      if (boundaryPois === undefined) {
        boundaryPois = new Map<number, BriefVisitedPoi>();
        poisByBoundary.set(row.boundaryId, boundaryPois);
      }
      if (!boundaryPois.has(row.id)) {
        const poi: BriefVisitedPoi = {
          id: row.id,
          poiId: row.poiId,
          coords: {
            latitude: row.latitude,
            longitude: row.longitude,
          },
          createdAt: row.createdAt.toISOString(),
          comment: row.comment,
          rating: row.rating,
          imageKey: row.imageKey,
        };
        if (row.name !== null) {
          poi.name = row.name;
        }
        boundaryPois.set(row.id, poi);
      }
    }

    // Assemble results from boundary info + lookup maps
    const levelOrder: Record<string, number> = {
      COUNTRY: 1,
      REGION: 2,
      COUNTY: 3,
      CITY: 4,
      DISTRICT: 5,
      NEIGHBORHOOD: 6,
    };

    const stats: UserZoneStat[] = boundaryInfoRows.map((b) => {
      const subzones = subzonesMap.get(b.id);

      if (!includeValidatedPois) {
        return {
          zone_id: b.id,
          name: b.name,
          boundary_level: b.boundary_level,
          parent_id: b.parent_id,
          validated_pois_count: validatedCountMap.get(b.id) ?? 0,
          validated_pois: [],
          total_pois_count: totalPoisMap.get(b.id) ?? 0,
          total_subzones_count: subzones?.total ?? 0,
          completed_subzones_count: subzones?.completed ?? 0,
        };
      }

      const bPois = poisByBoundary.get(b.id);
      const validatedPois =
        bPois !== undefined ? Array.from(bPois.values()) : [];

      return {
        zone_id: b.id,
        name: b.name,
        boundary_level: b.boundary_level,
        parent_id: b.parent_id,
        validated_pois_count: validatedPois.length,
        validated_pois: validatedPois,
        total_pois_count: totalPoisMap.get(b.id) ?? 0,
        total_subzones_count: subzones?.total ?? 0,
        completed_subzones_count: subzones?.completed ?? 0,
      };
    });

    // Sort by boundary level then name (same order as the original query)
    stats.sort((a, b) => {
      const levelDiff =
        (levelOrder[a.boundary_level] ?? 99) -
        (levelOrder[b.boundary_level] ?? 99);
      if (levelDiff !== 0) return levelDiff;
      return a.name.localeCompare(b.name);
    });

    return stats;
  }
}
