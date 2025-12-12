import { and, eq, sql } from "drizzle-orm";
import { alias, unionAll } from "drizzle-orm/pg-core";

import { type DrizzleClient } from "../drizzleClient.js";
import { boundaries, poiBoundaries, poiData, pois } from "../schema.js";

interface SearchResult {
  type: "POI" | "CITY";
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  cityName?: string;
  departmentName?: string;
}

/**
 * Calculates the relevance score for search results.
 * Returns a SQL expression that computes:
 * - 0: Exact match (highest priority)
 * - 1: Starts with query (high priority)
 * - 1000+: Contains query (lower priority, based on position and length)
 */
const calculateRelevanceScore = (
  nameColumn: unknown,
  query: string,
): ReturnType<typeof sql<number>> => {
  return sql<number>`(
    CASE 
      -- Exact match: highest priority (score 0)
      WHEN normalize_search_text(${nameColumn}) = normalize_search_text(${query}) THEN 0
      -- Starts with query: high priority (score 1)
      WHEN normalize_search_text(${nameColumn}) LIKE normalize_search_text(${query}) || '%' THEN 1
      -- Contains query: lower priority, score based on position and length
      ELSE 1000 + POSITION(normalize_search_text(${query}) IN normalize_search_text(${nameColumn})) + LENGTH(${nameColumn}) / 10
    END
  )`;
};

export class SearchRepository {
  constructor(private readonly db: DrizzleClient) {}

  async searchPoisAndCities(query: string): Promise<SearchResult[]> {
    const poiQuery = this.db
      .select({
        type: sql<string>`'POI'`.as("type"),
        id: pois.id,
        name: poiData.name,
        latitude: sql<number>`ST_Y(${pois.coords}::geometry)`.as("latitude"),
        longitude: sql<number>`ST_X(${pois.coords}::geometry)`.as("longitude"),
        cityName: sql<string>`(
              SELECT city_b.name
              FROM ${poiBoundaries} pb2
              INNER JOIN ${boundaries} city_b ON pb2.boundary_id = city_b.id
              WHERE pb2.poi_id = ${pois.id}
                AND city_b.boundary_level = 'CITY'
              LIMIT 1
            )`.as("cityName"),
        departmentName: sql<string | null>`NULL`.as("departmentName"),
        relevance_score: calculateRelevanceScore(poiData.name, query).as(
          "relevance_score",
        ),
      })
      .from(pois)
      .innerJoin(poiData, eq(pois.id, poiData.poiId))
      .where(
        and(
          sql`normalize_search_text(${poiData.name}) LIKE '%' || normalize_search_text(${query}) || '%'`,
          eq(pois.disabled, false),
        ),
      )
      .orderBy(
        sql`${calculateRelevanceScore(poiData.name, query)} ASC`,
        sql`${poiData.name} ASC`,
      )
      .limit(10); // 10 POIs result max then get cities

    const deptBoundary = alias(boundaries, "dept_boundary");

    const cityQuery = this.db
      .select({
        type: sql<string>`'CITY'`.as("type"),
        id: boundaries.id,
        name: sql<string>`COALESCE(${boundaries.name}, '')`.as("name"),
        latitude: sql<number>`ST_Y(${boundaries.displayPoint}::geometry)`.as(
          "latitude",
        ),
        longitude: sql<number>`ST_X(${boundaries.displayPoint}::geometry)`.as(
          "longitude",
        ),
        cityName: sql<string>`NULL`.as("cityName"),
        departmentName: sql<string | null>`${deptBoundary.name}`.as(
          "departmentName",
        ),
        relevance_score: calculateRelevanceScore(boundaries.name, query).as(
          "relevance_score",
        ),
      })
      .from(boundaries)
      .leftJoin(
        deptBoundary,
        and(
          eq(boundaries.parentId, deptBoundary.id),
          eq(deptBoundary.boundaryLevel, "COUNTY"),
        ),
      )
      .where(
        and(
          sql`normalize_search_text(${boundaries.name}) LIKE '%' || normalize_search_text(${query}) || '%'`,
          eq(boundaries.boundaryLevel, "CITY"),
        ),
      )
      .orderBy(
        sql`${calculateRelevanceScore(boundaries.name, query)} ASC`,
        sql`${boundaries.name} ASC`,
      )
      .limit(10); // 10 cities result max then get POIs

    const union = unionAll(poiQuery, cityQuery).as("union_result");

    const results = await this.db
      .select()
      .from(union)
      .orderBy(
        sql`${union.relevance_score} ASC`,
        sql`CASE WHEN ${union.type} = 'CITY' THEN 0 ELSE 1 END`,
        sql`${union.name} ASC`,
      );

    return results
      .filter(
        (result) =>
          result.name !== null &&
          result.latitude !== null &&
          result.longitude !== null,
      )
      .map((result) => {
        const baseResult: SearchResult = {
          type: result.type as "POI" | "CITY",
          id: result.id,
          name: result.name ?? "",
          coordinates: {
            latitude: Number(result.latitude),
            longitude: Number(result.longitude),
          },
        };

        if (result.cityName !== null && result.cityName !== undefined) {
          baseResult.cityName = result.cityName;
        }

        if (
          result.departmentName !== null &&
          result.departmentName !== undefined
        ) {
          baseResult.departmentName = result.departmentName;
        }

        return baseResult;
      });
  }
}
