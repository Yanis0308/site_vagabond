import { generateValidator, jsonSchemas } from "@vagabond/shared-utils";

import { apiClient } from "@/http/api-client";
import { logger } from "@/utils/logger";

const validateResponse = generateValidator(jsonSchemas.SearchResponseSchema);

export interface SearchResultType {
  type: "POI" | "CITY";
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  cityName?: string;
  departmentName?: string;
}

export const searchPlaces = async (
  query: string,
): Promise<SearchResultType[]> => {
  const rawResult = await apiClient
    .get("api/search", {
      searchParams: { q: query },
    })
    .json();

  if (!validateResponse(rawResult)) {
    throw new Error("Invalid response");
  }

  logger("search results length:", rawResult.data.length);

  return rawResult.data;
};
