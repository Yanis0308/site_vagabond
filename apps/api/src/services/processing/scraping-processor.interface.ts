import type { schema } from "@vagabond/database-client";
import type { FastifyInstance } from "fastify";

/**
 * Base interface for scraping responses
 */
export interface ScrapingResponse {
  success: boolean;
  error?: string;
}

/**
 * Metadata that can be added to processing results
 */
export interface ProcessingMetadata {
  distance?: number;
  isValid?: boolean;
}

/**
 * Interface for scraping processors
 * Each processor handles a specific type of scraping (Google Maps, Jina, etc.)
 */
export interface ScrapingProcessor<TInput, TResponse extends ScrapingResponse> {
  /**
   * Execute the scraping operation
   */
  execute(fastify: FastifyInstance, params: TInput): Promise<TResponse>;

  /**
   * Get the type identifier for the processing result
   */
  getType(): schema.ProcessingTypeEnum;

  /**
   * Transform input parameters into the format stored in processing result input
   */
  transformInput(params: TInput): Record<string, unknown>;

  /**
   * Transform the scraping response into the format stored in processing result output
   */
  transformOutput(response: TResponse): Record<string, unknown>;

  /**
   * Calculate metadata for the processing result (optional)
   * This can include distance, validation status, etc.
   */
  getMetadata?(
    params: TInput,
    response: TResponse,
  ): ProcessingMetadata | undefined;
}
