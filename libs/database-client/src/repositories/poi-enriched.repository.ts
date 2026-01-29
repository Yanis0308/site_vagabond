import { generateValidator, jsonSchemas, logger } from "@vagabond/shared-utils";
import { type PoiEnrichedData } from "@vagabond/shared-utils/dist/schemas/processors/llm.js";
import { and, eq } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { poiEnriched } from "../schema.js";
import { POI_ENRICHED_VERSION } from "../versions.js";

export interface CreatePoiEnrichedInput {
  poiId: string;
  enrichedData: PoiEnrichedData;
  source: string;
}

export interface PoiEnrichedWithData {
  id: number;
  poiId: string;
  source: string;
  version: number;
  enrichedData: PoiEnrichedData;
  createdAt: Date;
  updatedAt: Date;
}

export class PoiEnrichedRepository {
  private readonly validateEnrichedData = generateValidator(
    jsonSchemas.PoiEnrichedSchema,
  );

  constructor(private readonly db: DrizzleClient) {}

  async findByPoiId(poiId: string): Promise<PoiEnrichedWithData | undefined> {
    const enriched = await this.db.query.poiEnriched.findFirst({
      where: and(
        eq(poiEnriched.poiId, poiId),
        eq(poiEnriched.version, POI_ENRICHED_VERSION),
      ),
    });

    if (enriched === undefined) {
      return undefined;
    }

    const enrichedData: unknown | PoiEnrichedData = enriched.enrichedData;

    // Validate the JSON against PoiEnrichedSchema
    const isValid = this.validateEnrichedData(enrichedData);

    if (!isValid) {
      // Log validation errors but don't expose them to the user
      logger.error(
        `Invalid enriched data for POI ${poiId}:`,
        JSON.stringify(enriched.enrichedData, null, 2),
      );
      return undefined;
    }

    return {
      id: enriched.id,
      poiId: enriched.poiId,
      source: enriched.source,
      version: enriched.version,
      enrichedData: enrichedData,
      createdAt: enriched.createdAt,
      updatedAt: enriched.updatedAt,
    };
  }

  async upsert(
    data: CreatePoiEnrichedInput,
  ): Promise<PoiEnrichedWithData | undefined> {
    // Validate the enriched data before storing
    const isValid = this.validateEnrichedData(data.enrichedData);

    if (!isValid) {
      throw new Error(
        `Invalid enriched data for POI ${data.poiId}: data does not match PoiEnrichedSchema`,
      );
    }

    // Use upsert to handle existing records
    await this.db
      .insert(poiEnriched)
      .values({
        poiId: data.poiId,
        source: data.source,
        enrichedData: data.enrichedData,
      })
      .onConflictDoUpdate({
        target: poiEnriched.poiId,
        set: {
          source: data.source,
          enrichedData: data.enrichedData,
        },
      });

    // Fetch the complete record
    return await this.findByPoiId(data.poiId);
  }
}
