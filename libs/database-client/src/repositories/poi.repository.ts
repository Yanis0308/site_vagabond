import { and, eq, inArray, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  boundaries,
  poiBoundaries,
  poiData,
  pois,
  users,
  visitedPois,
} from "../schema.js";
import type { CustomPoiCreateInput } from "../types.js";
import { poiDataSourceEnum } from "../schema.js";

interface PoiWithData {
  id: string;
  coords: { latitude: number; longitude: number };
  data: Array<{
    id: number;
    name: string;
    description: string;
    filterLevel: "UNKNOWN" | "STRICT" | "STANDARD" | "INTERMEDIATE" | "LAXIST";
    rawInfo: Record<string, unknown>;
    language: "EN" | "FR";
    dataSource: "OSM" | "AI" | "CUSTOM";
    createdAt: string;
    updatedAt: string;
  }>;
  visitedPois: Array<{
    id: number;
    poiId: string;
    userId: string;
    username: string;
    createdAt: string;
    comment: string;
    imageKey: string;
    rating: number;
  }>;
}

export class PoiRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findInBoundingBoxWithData(boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }): Promise<PoiWithData[]> {
    const polygon = `POLYGON((
      ${boundingBox.minLng} ${boundingBox.minLat},
      ${boundingBox.maxLng} ${boundingBox.minLat},
      ${boundingBox.maxLng} ${boundingBox.maxLat},
      ${boundingBox.minLng} ${boundingBox.maxLat},
      ${boundingBox.minLng} ${boundingBox.minLat}
    ))`;

    const result = await this.db
      .select({
        id: pois.id,
        coords: sql<{
          latitude: number;
          longitude: number;
        }>`jsonb_build_object(
          'longitude', ST_X(${pois.coords}::geometry),
          'latitude', ST_Y(${pois.coords}::geometry)
        )`,
        data: sql<
          Array<{
            id: number;
            name: string;
            description: string;
            filterLevel:
              | "UNKNOWN"
              | "STRICT"
              | "STANDARD"
              | "INTERMEDIATE"
              | "LAXIST";
            rawInfo: Record<string, unknown>;
            language: "EN" | "FR";
            dataSource: "OSM" | "AI" | "CUSTOM";
            createdAt: string;
            updatedAt: string;
          }>
        >`json_agg (
          DISTINCT jsonb_build_object(
            'id', ${poiData.id},
            'name', ${poiData.name},
            'description', ${poiData.description},
            'filterLevel', ${pois.filterLevel},
            'rawInfo', ${poiData.rawInfo},
            'language', ${poiData.language},
            'dataSource', ${poiData.source},
            'createdAt', to_char(${poiData.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'updatedAt', to_char(${poiData.updatedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          )
        ) FILTER (WHERE ${poiData.id} IS NOT NULL)`,
        visitedPois: sql<
          Array<{
            id: number;
            poiId: string;
            userId: string;
            username: string;
            createdAt: string;
            comment: string;
            imageKey: string;
            rating: number;
          }>
        >`json_agg (
          DISTINCT jsonb_build_object(
            'id', ${visitedPois.id},
            'poiId', ${visitedPois.poiId},
            'userId', ${visitedPois.userId},
            'username', CASE 
              WHEN ${users.email} IS NOT NULL AND POSITION('@' IN ${users.email}) > 0 THEN 
                SUBSTRING(${users.email} FROM 1 FOR POSITION('@' IN ${users.email}) - 1)
              ELSE 'John Doe'
            END,
            'createdAt', to_char(${visitedPois.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'comment', ${visitedPois.comment},
            'imageKey', ${visitedPois.imageKey},
            'rating', ${visitedPois.rating}
          )
        ) FILTER (WHERE ${visitedPois.id} IS NOT NULL)`,
      })
      .from(pois)
      .leftJoin(poiData, eq(pois.id, poiData.poiId))
      .leftJoin(visitedPois, eq(pois.id, visitedPois.poiId))
      .leftJoin(users, eq(visitedPois.userId, users.userId))
      .where(
        and(
          sql`ST_Within(${pois.coords}::geometry, ST_GeomFromText(${polygon}, 4326))`,
          eq(pois.disabled, false),
        ),
      )
      .groupBy(pois.id)
      .limit(10000);

    return result.map((row) => ({
      ...row,
      data: row.data || [],
      visitedPois: row.visitedPois || [],
    }));
  }

  async createManyCustom(data: CustomPoiCreateInput[]): Promise<unknown> {
    if (data.length === 0) return;

    // Drizzle doesn't support bulk insert with custom SQL expressions for values easily in the builder if we need PostGIS functions inside values
    // But we can use the builder if we pre-format the values or use sql``
    // However, `ST_GeomFromText` needs to be called.
    // We can construct the values array with sql snippets.

    const values = data.map((item) => ({
      id: item.id,
      source: item.source as "OSM", // Cast if needed or ensure type match
      sourceId: item.sourceId,
      coords: sql`ST_GeomFromText('POINT(${item.coords.longitude} ${item.coords.latitude})', 4326)`,
      filterLevel: item.filterLevel as any,
    }));

    return await this.db
      .insert(pois)
      .values(values as any) // 'as any' because coords is a custom type and we are passing sql``
      .onConflictDoNothing({ target: [pois.source, pois.sourceId] });
  }

  async manyDisable(ids: string[], reason: string): Promise<unknown> {
    return await this.db
      .update(pois)
      .set({ disabled: true, disabledReason: reason })
      .where(inArray(pois.id, ids));
  }

  async findPoiName(poiId: string): Promise<string | undefined> {
    const result = await this.db.query.poiData.findFirst({
      where: eq(poiData.poiId, poiId),
      columns: { name: true },
    });
    return result?.name;
  }

  async findByIdWithNameAndCoords(poiId: string): Promise<{
    poiId: string;
    latitude: number;
    longitude: number;
    name: string;
    cityName: string | null;
  } | null> {
    const result = await this.db
      .select({
        poiId: pois.id,
        latitude: sql<number>`ST_Y(${pois.coords}::geometry)`.as("latitude"),
        longitude: sql<number>`ST_X(${pois.coords}::geometry)`.as("longitude"),
        name: poiData.name,
        cityName: sql<string | null>`(
          SELECT city_b.name
          FROM ${poiBoundaries} pb2
          INNER JOIN ${boundaries} city_b ON pb2.boundary_id = city_b.id
          WHERE pb2.poi_id = ${pois.id}
            AND city_b.boundary_level = 'CITY'
          LIMIT 1
        )`.as("cityName"),
      })
      .from(pois)
      .innerJoin(poiData, eq(pois.id, poiData.poiId))
      .where(eq(pois.id, poiId))
      .limit(1);

    const resultPoi = result[0];

    if (resultPoi?.name === undefined) {
      return null;
    }

    return {
      poiId: resultPoi.poiId,
      latitude: resultPoi.latitude,
      longitude: resultPoi.longitude,
      name: resultPoi.name,
      cityName: resultPoi.cityName ?? null,
    };
  }

  async findOsmTagsByPoiId(poiId: string): Promise<Record<string, unknown> | null> {
    const result = await this.db.query.poiData.findFirst({
      where: and(
        eq(poiData.poiId, poiId),
        eq(poiData.source, "OSM" as const),
      ),
      columns: { rawInfo: true },
    });

    if (result?.rawInfo === undefined || result.rawInfo === null) {
      return null;
    }

    return result.rawInfo as Record<string, unknown>;
  }
}
