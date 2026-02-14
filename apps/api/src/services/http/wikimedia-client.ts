import type { FastifyInstance } from "fastify";
import { Mwn } from "mwn";

import type {
  ScrapingErrorResponse,
  ScrapingResponse,
  ScrapingSuccessResponse,
} from "../processing/scraping-processor.interface.js";
import { wikimediaOAuthService } from "./wikimedia-oauth.service.js";

export interface FetchWikidataParams {
  wikidataId: string; // Format: "Q12345"
}

export interface FetchWikipediaParams {
  wikipediaTitle: string; // Format: "fr:Château de Versailles" or "Château de Versailles"
  lang?: string; // Language code (e.g., "fr"), extracted from title if present
}

export interface WikimediaSuccessData {
  data: Record<string, unknown>;
  wikipediaData?: Record<string, unknown>; // Wikipedia data if linked from Wikidata
}

export type WikimediaResponse = ScrapingResponse<WikimediaSuccessData>;

// Cache for bot instances
let wikidataBot: Mwn | null = null;
const wikipediaBots = new Map<string, Mwn>();

/**
 * Create bot configuration with OAuth if available
 */
async function createBotConfig(
  fastify: FastifyInstance,
): Promise<{ userAgent: string; OAuth2AccessToken?: string }> {
  const token = await wikimediaOAuthService.getAccessToken(fastify);
  return {
    userAgent: "VagabondBot/1.0 (https://vagabond.gg)",
    ...(token !== null && { OAuth2AccessToken: token }),
  };
}

/**
 * Create or get cached Wikidata bot instance
 * Invalidate cache and recreate if OAuth token needs refresh
 */
async function getWikidataBot(
  fastify: FastifyInstance,
  forceRefresh = false,
): Promise<Mwn> {
  if (wikidataBot === null || forceRefresh) {
    const config = await createBotConfig(fastify);
    wikidataBot = await Mwn.init({
      apiUrl: "https://www.wikidata.org/w/api.php",
      ...config,
    });
  }
  return wikidataBot;
}

/**
 * Create or get cached Wikipedia bot instance for a specific language
 * Invalidate cache and recreate if OAuth token needs refresh
 */
async function getWikipediaBot(
  fastify: FastifyInstance,
  lang: string,
  forceRefresh = false,
): Promise<Mwn> {
  if (forceRefresh) {
    wikipediaBots.delete(lang);
  }
  const cachedBot = wikipediaBots.get(lang);
  if (cachedBot !== undefined) {
    return cachedBot;
  }
  const config = await createBotConfig(fastify);
  const bot = await Mwn.init({
    apiUrl: `https://${lang}.wikipedia.org/w/api.php`,
    ...config,
  });
  wikipediaBots.set(lang, bot);
  return bot;
}

/**
 * Extract language code from Wikipedia title if present
 * Format: "fr:Château de Versailles" -> { lang: "fr", title: "Château de Versailles" }
 * Format: "Château de Versailles" -> { lang: "fr", title: "Château de Versailles" }
 */
function parseWikipediaTitle(title: string): { lang: string; title: string } {
  const parts = title.split(":");
  if (parts.length > 1) {
    return {
      lang: parts[0] ?? "fr",
      title: parts.slice(1).join(":"),
    };
  }
  // Default to French if no language prefix
  return {
    lang: "fr",
    title,
  };
}

/**
 * Simplify Wikidata entity data to a more usable format
 */
function simplifyWikidataEntity(
  entityId: string,
  entity: Record<string, unknown>,
): Record<string, unknown> {
  const simplified: Record<string, unknown> = {
    id: entityId,
  };

  // Extract labels (prefer French, then English, then any)
  const labels = entity.labels as Record<string, { value: string }> | undefined;
  if (labels !== undefined) {
    const firstLabel = Object.values(labels)[0];
    simplified.label =
      labels.fr?.value ?? labels.en?.value ?? firstLabel?.value;
    simplified.labels = Object.fromEntries(
      Object.entries(labels).map(([lang, label]) => [lang, label.value]),
    );
  }

  // Extract descriptions (prefer French, then English, then any)
  const descriptions = entity.descriptions as
    | Record<string, { value: string }>
    | undefined;
  if (descriptions !== undefined) {
    const firstDescription = Object.values(descriptions)[0];
    simplified.description =
      descriptions.fr?.value ??
      descriptions.en?.value ??
      firstDescription?.value;
    simplified.descriptions = Object.fromEntries(
      Object.entries(descriptions).map(([lang, desc]) => [lang, desc.value]),
    );
  }

  // Extract claims (properties)
  const claims = entity.claims as Record<string, unknown[]> | undefined;
  if (claims !== undefined) {
    const simplifiedClaims: Record<string, unknown> = {};
    for (const [propId, propClaims] of Object.entries(claims)) {
      if (Array.isArray(propClaims) && propClaims.length > 0) {
        // Take the first claim (preferred) and extract its value
        const mainClaim = propClaims[0] as {
          mainsnak?: { datavalue?: { value?: unknown } };
        };
        const claimValue = mainClaim.mainsnak?.datavalue?.value;
        if (claimValue !== undefined) {
          simplifiedClaims[propId] = claimValue;
        }
      }
    }
    simplified.claims = simplifiedClaims;
  }

  // Extract sitelinks
  const sitelinks = entity.sitelinks as
    | Record<string, { site: string; title: string }>
    | undefined;
  if (sitelinks !== undefined) {
    simplified.sitelinks = Object.fromEntries(
      Object.entries(sitelinks).map(([site, link]) => [
        site,
        {
          site: link.site,
          title: link.title,
        },
      ]),
    );
  }

  // Keep other useful fields
  if (entity.type !== undefined) {
    simplified.type = entity.type;
  }
  if (entity.pageid !== undefined) {
    simplified.pageid = entity.pageid;
  }

  return simplified;
}

/**
 * Fetch Wikipedia page wikitext content using MediaWiki API via mwn
 */
async function fetchWikipediaWikitext(
  fastify: FastifyInstance,
  lang: string,
  title: string,
): Promise<string | null> {
  try {
    const wikitext = await executeWithAuthRetry(
      fastify,
      (forceRefresh) => getWikipediaBot(fastify, lang, forceRefresh),
      async (bot) => {
        const page = await bot.read(title);
        const revisions = page.revisions;
        if (Array.isArray(revisions) && revisions.length > 0) {
          return revisions[0]?.content ?? null;
        }
        return null;
      },
      "wikipedia",
    );

    return wikitext;
  } catch (error) {
    fastify.log.warn(
      { error, lang, title },
      "Failed to fetch Wikipedia wikitext via MediaWiki API",
    );
    return null;
  }
}

/**
 * Parse infoboxes from wikitext and return structured data
 */
function parseInfoboxes(
  fastify: FastifyInstance,
  bot: Mwn,
  wikitext: string,
): Record<string, Record<string, unknown>> {
  const infoboxes: Record<string, Record<string, unknown>> = {};

  try {
    // Parse templates from wikitext using mwn
    const wkt = new bot.Wikitext(wikitext);
    const templates = wkt.parseTemplates({});

    for (const template of templates) {
      // Check if template is an infobox (can start with "Infobox", "Infoboîte", etc.)
      const templateNameStr = String(template.name).toLowerCase();
      if (
        templateNameStr.startsWith("infobox") ||
        templateNameStr.startsWith("infoboîte") ||
        templateNameStr.startsWith("infocadre")
      ) {
        // Extract parameters as key-value pairs
        const params: Record<string, unknown> = {};
        for (const param of template.parameters) {
          const paramName = String(param.name).trim();
          const paramValue = param.value.trim();
          if (paramName !== "") {
            params[paramName] = paramValue;
          }
        }

        // Use template name as key (preserve original case)
        const templateNameKey = String(template.name);
        if (templateNameKey !== "") {
          infoboxes[templateNameKey] = params;
        }
      }
    }
  } catch (error) {
    fastify.log.warn({ error }, "Failed to parse infoboxes from wikitext");
  }

  return infoboxes;
}

/**
 * Fetch Wikipedia page content using MediaWiki API via mwn
 */
async function fetchWikipediaSummary(
  fastify: FastifyInstance,
  lang: string,
  title: string,
): Promise<Record<string, unknown> | null> {
  try {
    // Get bot instance for parsing infoboxes
    const bot = await getWikipediaBot(fastify, lang);

    // Use MediaWiki API query action to get full page content with auth retry
    const response = await executeWithAuthRetry(
      fastify,
      (forceRefresh) => getWikipediaBot(fastify, lang, forceRefresh),
      async (bot) =>
        await bot.request({
          action: "query",
          prop: "extracts|info|pageimages|categories|links|coordinates",
          titles: title,
          explaintext: true, // Return plain text instead of HTML
          piprop: "thumbnail|original",
          pithumbsize: 300, // Thumbnail size
          inprop: "url", // Include page URL
          cllimit: "max", // Maximum categories
          pllimit: "max", // Maximum links
        }),
      "wikipedia",
    );

    const pages = response.query?.pages as Record<string, unknown>;
    const pageIds = Object.keys(pages);

    if (pageIds.length === 0) {
      return null;
    }

    const pageId = pageIds[0];
    if (pageId === undefined) {
      return null;
    }

    const page = pages[pageId] as Record<string, unknown> | undefined;
    if (page === undefined) {
      return null;
    }

    // Check if page is missing
    if ("missing" in page) {
      return null;
    }

    // Fetch wikitext and parse infoboxes
    const wikitext = await fetchWikipediaWikitext(fastify, lang, title);
    const infoboxes =
      wikitext !== null ? parseInfoboxes(fastify, bot, wikitext) : {};

    // Extract categories
    const categories = Array.isArray(page.categories)
      ? (page.categories as Array<{ title?: string }>).map((cat) => ({
          title: cat.title ?? "",
        }))
      : [];

    // Extract links
    const links = Array.isArray(page.links)
      ? (page.links as Array<{ title?: string }>).map((link) => ({
          title: link.title ?? "",
        }))
      : [];

    // Extract coordinates
    let coordinates: { lat: number; lon: number } | undefined;
    if (
      Array.isArray(page.coordinates) &&
      page.coordinates.length > 0 &&
      page.coordinates[0] !== undefined
    ) {
      const coord = page.coordinates[0] as {
        lat?: number;
        lon?: number;
      };
      if (coord.lat !== undefined && coord.lon !== undefined) {
        coordinates = {
          lat: coord.lat,
          lon: coord.lon,
        };
      }
    }

    // Extract sections
    const sections = Array.isArray(page.sections)
      ? (
          page.sections as Array<{
            toclevel?: number;
            level?: string;
            line?: string;
            number?: string;
          }>
        ).map((section) => ({
          toclevel: section.toclevel ?? 0,
          level: section.level ?? "",
          line: section.line ?? "",
          number: section.number ?? "",
        }))
      : [];

    // Transform MediaWiki API response to a format similar to REST API v1
    const summary: Record<string, unknown> = {
      title: page.title ?? title,
      extract: page.extract ?? "",
      pageid: page.pageid,
      infoboxes,
      categories,
      links,
      sections,
    };

    if (coordinates !== undefined) {
      summary.coordinates = coordinates;
    }

    if (page.fullurl !== undefined) {
      summary.content_urls = {
        desktop: { page: page.fullurl },
        mobile: { page: page.fullurl },
      };
    }

    if (page.thumbnail !== undefined) {
      const thumbnail = page.thumbnail as {
        source?: string;
        width?: number;
        height?: number;
      };
      summary.thumbnail = {
        source: thumbnail.source,
        width: thumbnail.width,
        height: thumbnail.height,
      };
    }

    if (page.original !== undefined) {
      const original = page.original as {
        source?: string;
        width?: number;
        height?: number;
      };
      summary.originalimage = {
        source: original.source,
        width: original.width,
        height: original.height,
      };
    }

    return summary;
  } catch (error) {
    fastify.log.warn(
      { error, lang, title },
      "Failed to fetch Wikipedia content via MediaWiki API",
    );
    return null;
  }
}

/**
 * Fetch Wikidata entity by ID
 */
/**
 * Execute a request with automatic token refresh on 401/403 errors
 */
async function executeWithAuthRetry<T>(
  fastify: FastifyInstance,
  getBot: (forceRefresh?: boolean) => Promise<Mwn>,
  requestFn: (bot: Mwn) => Promise<T>,
  botType: "wikidata" | "wikipedia",
): Promise<T> {
  let bot = await getBot();
  let retryCount = 0;
  const maxRetries = 1;

  while (retryCount <= maxRetries) {
    try {
      return await requestFn(bot);
    } catch (error: unknown) {
      // Check if it's an authentication error
      const isAuthError =
        error !== undefined &&
        typeof error === "object" &&
        error !== null &&
        ("code" in error || "statusCode" in error) &&
        ((error as { code?: number }).code === 401 ||
          (error as { code?: number }).code === 403 ||
          (error as { statusCode?: number }).statusCode === 401 ||
          (error as { statusCode?: number }).statusCode === 403);

      if (
        isAuthError &&
        retryCount < maxRetries &&
        wikimediaOAuthService.isConfigured(fastify)
      ) {
        fastify.log.warn(
          {
            botType,
            retryCount,
            error:
              error instanceof Error ? error.message : JSON.stringify(error),
          },
          "Authentication error detected, refreshing token and retrying",
        );

        // Reset OAuth service cache to force refresh
        wikimediaOAuthService.reset();

        // Recreate bot with new token
        bot = await getBot(true);

        retryCount++;
        continue;
      }

      // Re-throw if not auth error or max retries reached
      throw error;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("Unexpected error in executeWithAuthRetry");
}

export async function fetchWikidataEntity(
  fastify: FastifyInstance,
  params: FetchWikidataParams,
): Promise<WikimediaResponse> {
  try {
    // Fetch entity using wbgetentities action with auth retry
    const response = await executeWithAuthRetry(
      fastify,
      (forceRefresh) => getWikidataBot(fastify, forceRefresh),
      async (bot) =>
        await bot.request({
          action: "wbgetentities",
          ids: params.wikidataId,
          props: "claims|sitelinks|labels|descriptions",
        }),
      "wikidata",
    );

    const entities = response.entities as Record<string, unknown> | undefined;

    if (entities === undefined || Object.keys(entities).length === 0) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `No entity found for Wikidata ID: ${params.wikidataId}`,
      };
      return errorResponse;
    }

    // Get the entity (should be only one)
    const entityIds = Object.keys(entities);
    if (entityIds.length === 0) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `No entity found for Wikidata ID: ${params.wikidataId}`,
      };
      return errorResponse;
    }

    const entityId = entityIds[0];
    if (entityId === undefined) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `Entity ID is undefined for Wikidata ID: ${params.wikidataId}`,
      };
      return errorResponse;
    }

    const entity = entities[entityId] as Record<string, unknown> | undefined;

    if (entity === undefined) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `Entity data is empty for Wikidata ID: ${params.wikidataId}`,
      };
      return errorResponse;
    }

    // Simplify entity data
    const simplifiedEntity = simplifyWikidataEntity(entityId, entity);

    // Check if entity has Wikipedia sitelinks and fetch Wikipedia page if available
    let wikipediaData: Record<string, unknown> | undefined;
    const entityWithSitelinks = entity as {
      sitelinks?: Record<string, { site: string; title: string }>;
    };

    // Try to find French Wikipedia sitelink first, then any other language
    const sitelinks = entityWithSitelinks.sitelinks;
    if (sitelinks !== undefined) {
      const frwikiSitelink = sitelinks.frwiki;
      const anyWikiSitelink =
        frwikiSitelink ??
        Object.values(sitelinks).find((link) => link.site.endsWith("wiki"));

      if (anyWikiSitelink !== undefined) {
        const lang = anyWikiSitelink.site.replace("wiki", "");
        const title = anyWikiSitelink.title;

        try {
          fastify.log.info(
            { wikidataId: params.wikidataId, lang, title },
            "Fetching Wikipedia page linked from Wikidata entity",
          );

          // Fetch Wikipedia summary using MediaWiki API
          const wikipediaResponse = await fetchWikipediaSummary(
            fastify,
            lang,
            title,
          );

          if (wikipediaResponse !== null) {
            wikipediaData = wikipediaResponse;
          }
        } catch (wikipediaError) {
          fastify.log.warn(
            {
              error: wikipediaError,
              wikidataId: params.wikidataId,
              lang,
              title,
            },
            "Failed to fetch Wikipedia page linked from Wikidata, continuing without Wikipedia data",
          );
          // Continue without Wikipedia data if fetch fails
        }
      }
    }

    const successData: WikimediaSuccessData = {
      data: simplifiedEntity,
      ...(wikipediaData !== undefined && { wikipediaData }),
    };

    const successResponse: ScrapingSuccessResponse<WikimediaSuccessData> = {
      success: true,
      ...successData,
    };

    return successResponse;
  } catch (error) {
    fastify.log.error({ error, params }, "Wikidata entity fetch failed");

    const errorResponse: ScrapingErrorResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `HTTP request failed: ${String(error)}`,
      ...(error instanceof Error && { errorInstance: error }),
    };

    return errorResponse;
  }
}

/**
 * Fetch Wikipedia page content
 */
export async function fetchWikipediaPage(
  fastify: FastifyInstance,
  params: FetchWikipediaParams,
): Promise<WikimediaResponse> {
  try {
    const { lang, title } = parseWikipediaTitle(params.wikipediaTitle);

    // Fetch Wikipedia summary using MediaWiki API
    const response = await fetchWikipediaSummary(fastify, lang, title);

    if (response === null) {
      const errorResponse: ScrapingErrorResponse = {
        success: false,
        error: `Failed to fetch Wikipedia page: ${title} (${lang})`,
      };
      return errorResponse;
    }

    const successData: WikimediaSuccessData = {
      data: response,
    };

    const successResponse: ScrapingSuccessResponse<WikimediaSuccessData> = {
      success: true,
      ...successData,
    };

    return successResponse;
  } catch (error) {
    fastify.log.error({ error, params }, "Wikipedia page fetch failed");

    const errorResponse: ScrapingErrorResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `HTTP request failed: ${String(error)}`,
      ...(error instanceof Error && { errorInstance: error }),
    };

    return errorResponse;
  }
}
