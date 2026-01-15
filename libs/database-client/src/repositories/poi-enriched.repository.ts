import { eq } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { poiEnriched, poiFunFacts } from "../schema.js";

export interface CreatePoiEnrichedInput {
  poiId: string;
  name?: string | null;
  description?: string | null;
  source: string;
  funFacts?: Array<{ content: string; order: number }>;
}

export interface PoiEnrichedWithFunFacts {
  id: number;
  poiId: string;
  name: string | null;
  description: string | null;
  source: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  funFacts: Array<{
    id: number;
    content: string;
    order: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export class PoiEnrichedRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findByPoiId(
    poiId: string,
  ): Promise<PoiEnrichedWithFunFacts | undefined> {
    const enriched = await this.db.query.poiEnriched.findFirst({
      where: eq(poiEnriched.poiId, poiId),
      with: {
        funFacts: {
          orderBy: (facts, { asc }) => [asc(facts.order)],
        },
      },
    });

    if (enriched === undefined) {
      return undefined;
    }

    return {
      id: enriched.id,
      poiId: enriched.poiId,
      name: enriched.name,
      description: enriched.description,
      source: enriched.source,
      version: enriched.version,
      createdAt: enriched.createdAt,
      updatedAt: enriched.updatedAt,
      funFacts: enriched.funFacts.map((fact) => ({
        id: fact.id,
        content: fact.content,
        order: fact.order,
        version: fact.version,
        createdAt: fact.createdAt,
        updatedAt: fact.updatedAt,
      })),
    };
  }

  async upsert(
    data: CreatePoiEnrichedInput,
  ): Promise<PoiEnrichedWithFunFacts | undefined> {
    // Use upsert to handle existing records
    const [enriched] = await this.db
      .insert(poiEnriched)
      .values({
        poiId: data.poiId,
        name: data.name ?? null,
        description: data.description ?? null,
        source: data.source,
      })
      .onConflictDoUpdate({
        target: poiEnriched.poiId,
        set: {
          name: data.name ?? null,
          description: data.description ?? null,
          source: data.source,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (enriched === undefined) {
      return undefined;
    }

    // Delete existing fun facts before inserting new ones
    await this.db
      .delete(poiFunFacts)
      .where(eq(poiFunFacts.poiEnrichedId, enriched.id));

    // Insert fun facts if provided
    if (data.funFacts !== undefined && data.funFacts.length > 0) {
      await this.db.insert(poiFunFacts).values(
        data.funFacts.map((fact) => ({
          poiEnrichedId: enriched.id,
          content: fact.content,
          order: fact.order,
        })),
      );
    }

    // Fetch the complete record with fun facts
    return await this.findByPoiId(data.poiId);
  }
}
