import type { FastifyInstance } from "fastify";

import { getLogger } from "../../utils/logger.js";
import { createBaseClient } from "./base-client.js";

interface HubDestination {
  url?: string;
  site?: string;
  lang?: string;
}

interface HubJsonResponse {
  origin?: unknown;
  destination?: HubDestination;
}

/**
 * Resolve a Wikidata ID to its Wikipedia URL via hub.toolforge.org.
 * Returns the Wikipedia URL in French (lang=fr) if available,
 * or the wikidata.org URL as fallback.
 */
export async function resolveWikidataToWikipediaUrl(
  fastify: FastifyInstance,
  wikidataId: string,
  lang = "fr",
): Promise<string> {
  const fallbackUrl = `https://www.wikidata.org/wiki/${wikidataId}`;

  try {
    const client = createBaseClient(fastify);
    const response = await client
      .get(`https://hub.toolforge.org/${wikidataId}`, {
        searchParams: { lang, format: "json" },
      })
      .json<HubJsonResponse>();

    const destinationUrl = response.destination?.url;
    if (typeof destinationUrl === "string" && destinationUrl.length > 0) {
      return destinationUrl;
    }

    return fallbackUrl;
  } catch (error) {
    getLogger(fastify).warn(
      { error, wikidataId },
      "hub.toolforge.org failed, falling back to wikidata.org URL",
    );
    return fallbackUrl;
  }
}
