import type { FastifyInstance } from "fastify";

import type {
  ScrapingProcessor,
  ScrapingResponse,
} from "./scraping-processor.interface.js";

export interface ProcessInput<TInput> {
  targetId: string;
  params: TInput;
  batchId?: string | null;
}

export interface ProcessResult<TResponse extends ScrapingResponse> {
  processingResultId: number;
  success: boolean;
  scrapeResponse: TResponse | undefined;
  error?: string;
}

/**
 * Orchestrator service that handles the common workflow for processing results:
 * 1. Create processing result with pending status
 * 2. Execute scraping via processor
 * 3. Update processing result with result
 * 4. Handle errors
 */
export class ProcessingResultOrchestrator {
  constructor(private readonly fastify: FastifyInstance) {}

  /**
   * Process scraping using a specific processor
   * Returns a typed result with the specific response type from the processor
   */
  async process<TInput, TResponse extends ScrapingResponse>(
    processor: ScrapingProcessor<TInput, TResponse>,
    input: ProcessInput<TInput>,
  ): Promise<ProcessResult<TResponse>> {
    const { targetId, params, batchId } = input;

    // 1. Create processing result with pending status
    const processingResult =
      await this.fastify.dbRepositories.processingResult.create({
        targetId,
        status: "pending",
        input: processor.transformInput(params),
        output: null,
        batchId: batchId ?? null,
        type: processor.getType(),
      });

    if (processingResult === undefined) {
      return {
        processingResultId: 0,
        success: false,
        scrapeResponse: undefined,
        error: "Failed to create processing result",
      };
    }

    const processingResultId = processingResult.id;
    const startTime = Date.now();

    try {
      // 2. Execute scraping
      const scrapeResponse = await processor.execute(this.fastify, params);

      // 3. Update processing result with result
      const duration = Date.now() - startTime;
      if (scrapeResponse.success) {
        // Get metadata from processor if available (distance, isValid, etc.)
        const metadata = processor.getMetadata?.(params, scrapeResponse);

        const updateData: {
          status: "success";
          output: Record<string, unknown>;
          duration: number;
          distance?: number;
          isValid?: boolean;
        } = {
          status: "success",
          output: processor.transformOutput(scrapeResponse),
          duration,
          ...metadata,
        };

        await this.fastify.dbRepositories.processingResult.update(
          processingResultId,
          updateData,
        );
      } else {
        await this.fastify.dbRepositories.processingResult.update(
          processingResultId,
          {
            status: "error",
            output: {
              error: scrapeResponse.error ?? "Unknown scraping error",
            },
            duration,
          },
        );
      }

      return {
        processingResultId,
        success: scrapeResponse.success,
        scrapeResponse,
        ...(scrapeResponse.error !== undefined &&
          scrapeResponse.error !== "" && { error: scrapeResponse.error }),
      };
    } catch (error) {
      // Update processing result with error status
      const duration = Date.now() - startTime;
      await this.fastify.dbRepositories.processingResult.update(
        processingResultId,
        {
          status: "error",
          output: {
            error: error instanceof Error ? error.message : String(error),
          },
          duration,
        },
      );

      return {
        processingResultId,
        success: false,
        scrapeResponse: undefined,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
