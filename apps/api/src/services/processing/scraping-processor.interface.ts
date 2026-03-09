import type { ProcessingType } from "@vagabond/database-client";
import type { FastifyInstance } from "fastify";

/**
 * Response when scraping succeeds
 */
export type ScrapingSuccessResponse<TData> = TData & {
  success: true;
};

/**
 * Response when scraping fails
 */
export interface ScrapingErrorResponse {
  success: false;
  error: string;
  errorInstance?: Error;
  rawResult?: unknown;
}

/**
 * Union type for scraping responses
 * Use isScrapingSuccess() type guard to narrow the type
 */
export type ScrapingResponse<TData> =
  | ScrapingSuccessResponse<TData>
  | ScrapingErrorResponse;

/**
 * Type guard to check if a scraping response is a success response
 */
export function isScrapingSuccess<TData>(
  response: ScrapingResponse<TData>,
): response is ScrapingSuccessResponse<TData> {
  return response.success;
}

/**
 * Metadata that can be added to processing results
 */
export interface ProcessingMetadata {
  distance?: number;
  isValid?: boolean;
  cost?: number; // Number of tokens used (for Jina, Gemini, Groq)
  metadata?: Record<string, unknown>; // Other API metadata (excluding main data)
}

/**
 * Interface for scraping processors
 * Each processor handles a specific type of scraping (Google Maps, Jina, etc.)
 */
export interface ScrapingProcessor<
  TInput,
  TResponse extends ScrapingResponse<unknown>,
> {
  /**
   * Execute the scraping operation
   */
  execute(fastify: FastifyInstance, params: TInput): Promise<TResponse>;

  /**
   * Get the type identifier for the processing result
   */
  getType(): ProcessingType;

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
