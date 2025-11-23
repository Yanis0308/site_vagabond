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

export class SearchRepository {
  constructor(private readonly db: DrizzleClient) {}

  async searchPoisAndCities(query: string): Promise<SearchResult[]> {
    const poiQuery = this.db
      .select({
        type: sql<string>`'POI'`,
        id: pois.id,
        name: poiData.name,
        latitude: sql<number>`ST_Y(${pois.coords}::geometry)`,
        longitude: sql<number>`ST_X(${pois.coords}::geometry)`,
        cityName: sql<string>`(
              SELECT city_b.name
              FROM ${poiBoundaries} pb2
              INNER JOIN ${boundaries} city_b ON pb2.boundary_id = city_b.id
              WHERE pb2.poi_id = ${pois.id}
                AND city_b.boundary_level = 'CITY'
              LIMIT 1
            )`,
        departmentName: sql<string | null>`NULL`,
        relevance_score: sql<number>`POSITION(normalize_search_text(${query}) IN normalize_search_text(${poiData.name}))`,
      })
      .from(pois)
      .innerJoin(poiData, eq(pois.id, poiData.poiId))
      .where(
        and(
          sql`normalize_search_text(${poiData.name}) LIKE '%' || normalize_search_text(${query}) || '%'`,
          eq(pois.disabled, false),
        ),
      )
      .limit(20);

    const deptBoundary = alias(boundaries, "dept_boundary");

    const cityQuery = this.db
      .select({
        type: sql<string>`'CITY'`,
        id: boundaries.id,
        name: sql<string>`COALESCE(${boundaries.name}, '')`,
        latitude: sql<number>`ST_Y(${boundaries.displayPoint}::geometry)`,
        longitude: sql<number>`ST_X(${boundaries.displayPoint}::geometry)`,
        cityName: sql<string>`NULL`,
        departmentName: sql<string | null>`${deptBoundary.name}`,
        relevance_score: sql<number>`POSITION(normalize_search_text(${query}) IN normalize_search_text(${boundaries.name}))`,
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
      .limit(20);

    const results = await unionAll(poiQuery, cityQuery)
      .orderBy(
        sql`CASE WHEN type = 'CITY' THEN 0 ELSE 1 END`,
        sql`relevance_score ASC`,
        sql`name ASC`,
      )
      .limit(20);

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
