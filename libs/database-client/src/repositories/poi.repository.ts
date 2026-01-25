import { and, eq, inArray, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { boundaries, poiBoundaries, poiData, pois } from "../schema.js";
import type { CustomPoiCreateInput } from "../types.js";

export class PoiRepository {
  constructor(private readonly db: DrizzleClient) {}

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
      coords: sql`ST_SetSRID(ST_MakePoint(${item.coords.longitude}, ${item.coords.latitude}), 4326)`,
      filterLevel: item.filterLevel,
    }));

    return await this.db
      .insert(pois)
      .values(values)
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

  async findOsmTagsByPoiId(
    poiId: string,
  ): Promise<Record<string, unknown> | null> {
    const result = await this.db.query.poiData.findFirst({
      where: and(eq(poiData.poiId, poiId), eq(poiData.source, "OSM" as const)),
      columns: { rawInfo: true },
    });

    if (result?.rawInfo === undefined || result.rawInfo === null) {
      return null;
    }

    return result.rawInfo as Record<string, unknown>;
  }
}
