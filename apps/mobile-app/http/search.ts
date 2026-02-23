import {
  SearchResponseSchema,
  type SearchResult,
  validateWithSchema,
} from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

export const searchPlaces = async (query: string): Promise<SearchResult[]> => {
  const rawResult = await apiClient
    .get("api/search", {
      searchParams: { q: query },
    })
    .json();

  if (!validateWithSchema(SearchResponseSchema, rawResult)) {
    throw new Error("Invalid response");
  }

  logger("search results length:", rawResult.data.length);

  return rawResult.data;
};
