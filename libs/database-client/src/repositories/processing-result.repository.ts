import { eq } from "drizzle-orm";

import { type DrizzleClient } from "../drizzleClient.js";
import {
  processingResults,
  type ProcessingStatusEnum,
  type ProcessingTypeEnum,
} from "../schema.js";

export interface CreateProcessingResultInput {
  targetId: string;
  status: ProcessingStatusEnum;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  batchId?: string | null;
  type: ProcessingTypeEnum;
}

export interface UpdateProcessingResultInput {
  status?: ProcessingStatusEnum;
  output?: Record<string, unknown> | null;
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
      })
      .where(eq(processingResults.id, id));
  }

  async findByTargetId(
    targetId: string,
  ): Promise<Array<typeof processingResults.$inferSelect>> {
    return await this.db.query.processingResults.findMany({
      where: eq(processingResults.targetId, targetId),
      orderBy: (results, { desc }) => [desc(results.createdAt)],
    });
  }
}
