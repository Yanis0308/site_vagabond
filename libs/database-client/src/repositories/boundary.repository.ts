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
import {
  mapWithIsoDate,
  mapWithNullableIsoDate,
  mapWithNullableString,
} from "../sqlMappers.js";

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

// v2 : sans validated_pois (récupérés via /api/v2/visited-pois?boundaryId=…),
// + last_visited_poi_at/name pour le tri du profil et l'affichage du "dernier visité".
interface UserZoneStatV2 {
  zone_id: string;
  name: string;
  boundary_level: BoundaryLevelEnum;
  parent_id: string | null;
  visited_pois_count: number;
  total_pois_count: number;
  total_subzones_count: number;
  completed_subzones_count: number;
  last_visited_poi_at: string | null;
  last_visited_poi_name: string | null;
}

export class BoundaryRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findIdForPoiAtLevel(
    poiId: string,
    level: BoundaryLevelEnum,
  ): Promise<string | undefined> {
    const result = await this.db
      .select({ boundaryId: boundaries.id })
      .from(poiBoundaries)
      .innerJoin(boundaries, eq(poiBoundaries.boundaryId, boundaries.id))
      .where(
        and(
          eq(poiBoundaries.poiId, poiId),
          eq(boundaries.boundaryLevel, level),
        ),
      )
      .limit(1);

    return result[0]?.boundaryId;
  }

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
            disabled: pois.disabled,
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
          .innerJoin(pois, eq(pois.id, visitedPois.poiId))
          .where(
            and(
              eq(visitedPois.userId, userId),
              inArray(poiBoundaries.boundaryId, relevantZoneIds),
              eq(pois.disabled, false),
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
        .innerJoin(pois, eq(pois.id, poiBoundaries.poiId))
        .where(
          and(
            inArray(poiBoundaries.boundaryId, relevantZoneIds),
            eq(pois.disabled, false),
          ),
        )
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
          isDisabled: row.disabled,
          createdAt: mapWithIsoDate(row.createdAt),
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
        validated_pois_count: validatedPois.filter((p) => !p.isDisabled).length,
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

  /**
   * v2 : version allégée de findUserZoneStats pour /api/v2/zones/stats/...
   * - Ne retourne PAS la liste détaillée des Visited POIs (le mobile les récupère via /api/v2/visited-pois?boundaryId=…).
   * - AJOUTE last_visited_poi_at + last_visited_poi_name pour le tri et l'affichage profil sans scanner l'arbre.
   */
  async findUserZoneStatsV2(
    userId: string,
    boundaryLevels: BoundaryLevelEnum[] = [
      "COUNTRY",
      "REGION",
      "COUNTY",
      "CITY",
      "DISTRICT",
      "NEIGHBORHOOD",
    ],
  ): Promise<UserZoneStatV2[]> {
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

    // `db.execute(sql.raw)` retourne un PgQueryResult brut (sans schema
    // Drizzle), donc `rows` est typé `Record<string, unknown>[]` — il n'y a
    // pas de colonne Drizzle sur laquelle accrocher un `.mapWith()`. On reste
    // sur un cast d'assertion ciblé.
    const relevantZoneIds = (
      relevantZonesResult.rows as Array<{ zone_id: string }>
    ).map((r) => r.zone_id);

    if (relevantZoneIds.length === 0) {
      return [];
    }

    const b2 = alias(boundaries, "b2");

    const [
      visitedCountRows,
      boundaryInfoRows,
      totalPoisRows,
      subzonesRows,
      lastVisitedRows,
    ] = await Promise.all([
      // Validated POIs count par boundary (sans la liste détaillée)
      this.db
        .select({
          boundaryId: poiBoundaries.boundaryId,
          count: countDistinct(visitedPois.poiId).mapWith(Number),
        })
        .from(visitedPois)
        .innerJoin(poiBoundaries, eq(poiBoundaries.poiId, visitedPois.poiId))
        .innerJoin(pois, eq(pois.id, visitedPois.poiId))
        .where(
          and(
            eq(visitedPois.userId, userId),
            inArray(poiBoundaries.boundaryId, relevantZoneIds),
            eq(pois.disabled, false),
          ),
        )
        .groupBy(poiBoundaries.boundaryId),

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

      this.db
        .select({
          boundaryId: poiBoundaries.boundaryId,
          totalPois: countDistinct(poiBoundaries.poiId).mapWith(Number),
        })
        .from(poiBoundaries)
        .innerJoin(pois, eq(pois.id, poiBoundaries.poiId))
        .where(
          and(
            inArray(poiBoundaries.boundaryId, relevantZoneIds),
            eq(pois.disabled, false),
          ),
        )
        .groupBy(poiBoundaries.boundaryId),

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

      // Last visited POI par boundary : DISTINCT ON (PostgreSQL) + sub-query name.
      // Plus rapide qu'un GROUP BY + lookup en deux passes côté JS.
      this.db.execute(sql`
        SELECT
          lv.boundary_id,
          lv.last_at,
          (
            SELECT pd.name FROM ${poiData} pd
            WHERE pd.poi_id = lv.last_poi_id
            ORDER BY pd.language DESC, pd.id LIMIT 1
          ) AS last_name
        FROM (
          SELECT DISTINCT ON (pb.boundary_id)
            pb.boundary_id,
            vp.created_at AS last_at,
            vp.poi_id AS last_poi_id
          FROM ${visitedPois} vp
          INNER JOIN ${poiBoundaries} pb ON pb.poi_id = vp.poi_id
          WHERE vp.user_id = ${userId}
            AND pb.boundary_id IN (${sql.join(
              relevantZoneIds.map((id) => sql`${id}`),
              sql`, `,
            )})
          ORDER BY pb.boundary_id, vp.created_at DESC
        ) lv
      `),
    ]);

    const validatedCountMap = new Map<string, number>();
    for (const row of visitedCountRows) {
      validatedCountMap.set(row.boundaryId, row.count);
    }

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

    const lastVisitedMap = new Map<
      string,
      { at: string | null; name: string | null }
    >();
    const lvRows = lastVisitedRows.rows as Array<{
      boundary_id: string;
      last_at: Date | string | null;
      last_name: string | null;
    }>;
    for (const row of lvRows) {
      lastVisitedMap.set(row.boundary_id, {
        at: mapWithNullableIsoDate(row.last_at),
        name: row.last_name,
      });
    }

    const levelOrder: Record<string, number> = {
      COUNTRY: 1,
      REGION: 2,
      COUNTY: 3,
      CITY: 4,
      DISTRICT: 5,
      NEIGHBORHOOD: 6,
    };

    const stats: UserZoneStatV2[] = boundaryInfoRows.map((b) => {
      const subzones = subzonesMap.get(b.id);
      const lv = lastVisitedMap.get(b.id);
      return {
        zone_id: b.id,
        name: b.name,
        boundary_level: b.boundary_level,
        parent_id: b.parent_id,
        visited_pois_count: validatedCountMap.get(b.id) ?? 0,
        total_pois_count: totalPoisMap.get(b.id) ?? 0,
        total_subzones_count: subzones?.total ?? 0,
        completed_subzones_count: subzones?.completed ?? 0,
        last_visited_poi_at: lv?.at ?? null,
        last_visited_poi_name: lv?.name ?? null,
      };
    });

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
