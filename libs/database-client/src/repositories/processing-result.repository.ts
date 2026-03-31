import { and, eq, sql } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import { processingResults, type ProcessingStatusEnum } from "../schema.js";
import type { ProcessingType } from "../types.js";

export interface CreateProcessingResultInput {
  targetId: string;
  status: ProcessingStatusEnum;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  batchId?: string | null;
  type: ProcessingType;
  distance?: number | null;
  isValid?: boolean | null;
  cost?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProcessingResultInput {
  status?: ProcessingStatusEnum;
  output?: Record<string, unknown> | null;
  duration?: number | null;
  distance?: number | null;
  isValid?: boolean | null;
  cost?: number | null;
  metadata?: Record<string, unknown> | null;
}

export class ProcessingResultRepository {
  constructor(private readonly db: DrizzleClient) {}

  async create(
    data: CreateProcessingResultInput,
  ): Promise<{ id: number } | undefined> {
    const result = await this.db
      .insert(processingResults)
      .values({
        targetId: data.targetId,
        status: data.status,
        input: data.input,
        output: data.output ?? null,
        batchId: data.batchId ?? null,
        type: data.type,
        distance: data.distance ?? null,
        isValid: data.isValid ?? null,
        cost: data.cost ?? null,
        metadata: data.metadata ?? null,
      })
      .returning({ id: processingResults.id });

    return result[0] ?? undefined;
  }

  async update(id: number, data: UpdateProcessingResultInput): Promise<void> {
    await this.db
      .update(processingResults)
      .set({
        status: data.status,
        output: data.output ?? null,
        duration: data.duration ?? null,
        distance: data.distance ?? null,
        isValid: data.isValid ?? null,
        cost: data.cost ?? null,
        metadata: data.metadata ?? null,
      })
      .where(eq(processingResults.id, id));
  }

  async findByTargetId(
    targetId: string,
  ): Promise<Array<typeof processingResults.$inferSelect>> {
    return await this.db.query.processingResults.findMany({
      where: eq(processingResults.targetId, targetId),
      orderBy: (results, { desc }) => [desc(results.updatedAt)],
    });
  }

  async findExistingSuccessResult(
    targetId: string,
    type: ProcessingType,
    version: number,
  ): Promise<typeof processingResults.$inferSelect | undefined> {
    const result = await this.db.query.processingResults.findFirst({
      where: and(
        eq(processingResults.targetId, targetId),
        eq(processingResults.type, type),
        eq(processingResults.status, "success"),
        eq(processingResults.version, version),
      ),
      orderBy: (results, { desc }) => [desc(results.updatedAt)],
    });

    return result;
  }

  /**
   * Find an existing successful jina-reader result for a given URL (across all POIs).
   * Used to cache Reader results by URL to avoid redundant API calls.
   */
  async findExistingSuccessResultByUrl(
    type: ProcessingType,
    version: number,
    url: string,
  ): Promise<typeof processingResults.$inferSelect | undefined> {
    const result = await this.db.query.processingResults.findFirst({
      where: and(
        eq(processingResults.type, type),
        eq(processingResults.status, "success"),
        eq(processingResults.version, version),
        sql`${processingResults.input}->>'url' = ${url}`,
      ),
      orderBy: (results, { desc }) => [desc(results.updatedAt)],
    });

    return result;
  }
}
