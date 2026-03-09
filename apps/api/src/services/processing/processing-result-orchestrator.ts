import { getProcessingResultVersion } from "@vagabond/database-client";
import type { FastifyInstance } from "fastify";

import { getLogger } from "../../utils/logger.js";
import type {
  ScrapingErrorResponse,
  ScrapingProcessor,
  ScrapingResponse,
} from "./scraping-processor.interface.js";
import { isScrapingSuccess } from "./scraping-processor.interface.js";

export interface ProcessInput<TInput> {
  targetId: string;
  params: TInput;
  batchId?: string | null;
  /**
   * When set, the cache lookup is done by this URL (across all POIs) instead of by targetId.
   * Used for jina-reader to share cached results across different POIs.
   */
  cacheByUrl?: string;
}

/**
 * Result when processing succeeds (processor executed successfully and returned success)
 * Only returned when scrapeResponse.success is true
 */
export interface ProcessSuccessResult<
  TResponse extends ScrapingResponse<unknown>,
> {
  success: true;
  processingResultId: number;
  scrapeResponse: TResponse;
}

/**
 * Result when processing fails at orchestrator level
 * (exception thrown, failed to create processing result, or processor returned success=false)
 */
export interface ProcessErrorResult {
  success: false;
  processingResultId: number;
  error: string;
  errorInstance?: Error;
}

/**
 * Union type for process results
 * Use isProcessSuccess() type guard to narrow the type
 */
export type ProcessResult<TResponse extends ScrapingResponse<unknown>> =
  | ProcessSuccessResult<TResponse>
  | ProcessErrorResult;

/**
 * Type guard to check if a result is a success result
 */
export function isProcessSuccess<TResponse extends ScrapingResponse<unknown>>(
  result: ProcessResult<TResponse>,
): result is ProcessSuccessResult<TResponse> {
  return result.success;
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
  async process<TInput, TResponse extends ScrapingResponse<unknown>>(
    processor: ScrapingProcessor<TInput, TResponse>,
    input: ProcessInput<TInput>,
  ): Promise<ProcessResult<TResponse>> {
    const { targetId, params, batchId, cacheByUrl } = input;
    const processorType = processor.getType();
    const version = getProcessingResultVersion(processorType);

    // Check if a successful result already exists
    // For jina-reader: cache by URL across all POIs
    // For others: cache by targetId
    const existingResult =
      cacheByUrl !== undefined
        ? await this.fastify.dbRepositories.processingResult.findExistingSuccessResultByUrl(
            processorType,
            version,
            cacheByUrl,
          )
        : await this.fastify.dbRepositories.processingResult.findExistingSuccessResult(
            targetId,
            processorType,
            version,
          );

    if (existingResult !== undefined && existingResult.output !== null) {
      // Reuse existing result
      try {
        // Reconstruct the scrape response from stored output
        const scrapeResponse = {
          success: true,
          ...(existingResult.output as Partial<TResponse>),
        } as TResponse;

        const result: ProcessSuccessResult<TResponse> = {
          processingResultId: existingResult.id,
          success: true,
          scrapeResponse,
        };
        return result;
      } catch (error) {
        getLogger(this.fastify).warn(
          {
            error,
            existingResultId: existingResult.id,
            targetId,
            processorType,
          },
          "Failed to reuse existing result, will process again",
        );
        // Continue with normal processing if reuse fails
      }
    }

    // 1. Create processing result with pending status
    const processingResult =
      await this.fastify.dbRepositories.processingResult.create({
        targetId,
        status: "pending",
        input: processor.transformInput(params),
        output: null,
        batchId: batchId ?? null,
        type: processorType,
      });

    if (processingResult === undefined) {
      const result: ProcessErrorResult = {
        processingResultId: 0,
        success: false,
        error: "Failed to create processing result",
      };
      return result;
    }

    const processingResultId = processingResult.id;
    const startTime = Date.now();

    try {
      // 2. Execute scraping
      const scrapeResponse = await processor.execute(this.fastify, params);

      // 3. Update processing result with result
      const duration = Date.now() - startTime;
      if (isScrapingSuccess(scrapeResponse)) {
        // Get metadata from processor if available (distance, isValid, cost, metadata, etc.)
        const metadata = processor.getMetadata?.(params, scrapeResponse);

        const updateData: {
          status: "success";
          output: Record<string, unknown>;
          duration: number;
          distance?: number;
          isValid?: boolean;
          cost?: number;
          metadata?: Record<string, unknown>;
        } = {
          status: "success",
          output: processor.transformOutput(scrapeResponse),
          duration,
          ...(metadata?.distance !== undefined && {
            distance: metadata.distance,
          }),
          ...(metadata?.isValid !== undefined && { isValid: metadata.isValid }),
          ...(metadata?.cost !== undefined && { cost: metadata.cost }),
          ...(metadata?.metadata !== undefined && {
            metadata: metadata.metadata,
          }),
        };

        await this.fastify.dbRepositories.processingResult.update(
          processingResultId,
          updateData,
        );
      } else {
        // scrapeResponse is ScrapingErrorResponse here
        const errorResponse = scrapeResponse as ScrapingErrorResponse;
        await this.fastify.dbRepositories.processingResult.update(
          processingResultId,
          {
            status: "error",
            output: {
              error: errorResponse.error,
            },
            duration,
          },
        );

        // Return ProcessErrorResult when processor response indicates failure
        // Transmit errorInstance from ScrapingErrorResponse if available
        const result: ProcessErrorResult = {
          processingResultId,
          success: false,
          error: errorResponse.error,
          ...(errorResponse.errorInstance !== undefined && {
            errorInstance: errorResponse.errorInstance,
          }),
        };
        return result;
      }

      // Return ProcessSuccessResult only when processor response indicates success
      const result: ProcessSuccessResult<TResponse> = {
        processingResultId,
        success: true,
        scrapeResponse,
      };
      return result;
    } catch (error) {
      // Update processing result with error status
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await this.fastify.dbRepositories.processingResult.update(
        processingResultId,
        {
          status: "error",
          output: {
            error: errorMessage,
          },
          duration,
        },
      );

      const result: ProcessErrorResult = {
        processingResultId,
        success: false,
        error: errorMessage,
        ...(error instanceof Error && { errorInstance: error }),
      };
      return result;
    }
  }
}
