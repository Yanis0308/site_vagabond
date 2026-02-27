import type {
  JinaSearchParams,
  JinaSearchResult,
} from "@vagabond/shared-utils";
import type { FastifyInstance } from "fastify";

import { resolveWikidataToWikipediaUrl } from "./http/hub-client.js";
import { JINA_READER_CONFIG } from "./http/jina-reader-config.js";
import type { JinaSearchResponse } from "./http/jina-search-client.js";
import {
  isProcessSuccess,
  ProcessingResultOrchestrator,
} from "./processing/processing-result-orchestrator.js";
import { JinaReaderProcessor } from "./processing/processors/jina-reader.processor.js";
import { JinaSearchProcessor } from "./processing/processors/jina-search.processor.js";
import { isScrapingSuccess } from "./processing/scraping-processor.interface.js";
import {
  type ContentItem,
  truncateContentBySource,
  type TruncatedSourceItem,
} from "./utils/content-truncation.js";

export interface OsmWikimediaTags {
  wikidata?: string;
  wikipedia?: string;
}

export interface JinaEnrichmentDiagnostic {
  searchUrlCount: number;
  tagUrlCount: number;
  filteredCount: number;
  blacklistedCount: number;
  readerSuccessCount: number;
  readerWithContentCount: number;
}

export interface JinaEnrichedResult {
  /** Contenu des pages web génériques (hors wikipedia/wikidata), tronqué, ordre de scraping */
  webContent: TruncatedSourceItem[];
  /** Contenu de la page Wikipedia */
  wikipediaContent: TruncatedSourceItem[];
  /** Contenu de la page Wikidata (ou Wikipedia liée) */
  wikidataContent: TruncatedSourceItem[];
  /** Diagnostic metrics for troubleshooting empty enrichment */
  diagnostic?: JinaEnrichmentDiagnostic;
}

export interface ReaderPageResult {
  title: string;
  content: string;
  url: string;
  source: "wikipedia" | "wikidata" | "web";
}

/**
 * Build a canonical key for URL deduplication.
 * Normalizes hostname and pathname (lowercase, no trailing slash, %20 → _),
 * so that URLs pointing to the same page are considered equal.
 */
function getCanonicalUrlKey(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname
      .replace(/\/$/, "")
      .replace(/%20/g, "_")
      .toLowerCase();
    return `${parsed.hostname.toLowerCase()}${pathname}`;
  } catch {
    return url;
  }
}

/**
 * Check if a URL's domain is in the blacklist.
 */
function isBlacklisted(url: string, blacklist: readonly string[]): boolean {
  try {
    const hostname = new URL(url).hostname;
    return blacklist.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

/**
 * Detect source type from URL domain.
 */
function detectSource(url: string): "wikipedia" | "wikidata" | "web" {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("wikidata.org")) {
      return "wikidata";
    }
    if (hostname.includes("wikipedia.org")) {
      return "wikipedia";
    }
  } catch {
    // fallthrough
  }
  return "web";
}

function encodeWikipediaTitle(title: string): string {
  return encodeURIComponent(title.replace(/ /g, "_"));
}

/**
 * Build Wikipedia URL from OSM wikipedia tag.
 * Format: "fr:Château de Versailles" → "https://fr.wikipedia.org/wiki/Ch%C3%A2teau_de_Versailles"
 */
function buildWikipediaUrl(wikipediaTag: string): string {
  const colonIdx = wikipediaTag.indexOf(":");
  if (colonIdx === -1) {
    return `https://fr.wikipedia.org/wiki/${encodeWikipediaTitle(wikipediaTag)}`;
  }
  const lang = wikipediaTag.slice(0, colonIdx);
  const title = wikipediaTag.slice(colonIdx + 1);
  return `https://${lang}.wikipedia.org/wiki/${encodeWikipediaTitle(title)}`;
}

/**
 * Orchestrate Jina Search + Reader for a POI enrichment.
 * 1. Search
 * 2. Extract + deduplicate URLs (Search results + OSM tags via hub)
 * 3. Filter (top N, blacklist)
 * 4. Read each URL in parallel
 * 5. Aggregate + clean + truncate
 */
export class JinaEnrichmentService {
  constructor(private readonly fastify: FastifyInstance) {}

  async enrich(
    poiId: string,
    searchParams: JinaSearchParams,
    osmTags: OsmWikimediaTags | null,
    batchId: string,
  ): Promise<JinaEnrichedResult> {
    const orchestrator = new ProcessingResultOrchestrator(this.fastify);
    const { urlBlacklist, topN } = JINA_READER_CONFIG;

    // 1. Jina Search
    const searchResult = await orchestrator.process(new JinaSearchProcessor(), {
      targetId: poiId,
      params: searchParams,
      batchId,
    });

    const jinaSearchUrls: string[] = [];
    if (
      isProcessSuccess(searchResult) &&
      isScrapingSuccess(searchResult.scrapeResponse)
    ) {
      const jinaSearchResponse =
        searchResult.scrapeResponse as JinaSearchResponse & {
          success: true;
        };
      const items = jinaSearchResponse.data.data ?? [];
      for (const item of items as JinaSearchResult[]) {
        if (typeof item.url === "string" && item.url.length > 0) {
          jinaSearchUrls.push(item.url);
        }
      }
    }

    this.fastify.log.info(
      {
        poiId,
        searchUrlCount: jinaSearchUrls.length,
        searchSuccess: isProcessSuccess(searchResult),
      },
      "Jina enrichment: search step",
    );

    // 2. Build extra URLs from OSM tags (wikipedia + wikidata via hub)
    const tagUrls: string[] = [];

    if (osmTags?.wikipedia !== undefined && osmTags.wikipedia.trim() !== "") {
      const wpUrl = buildWikipediaUrl(osmTags.wikipedia);
      tagUrls.push(wpUrl);
    }

    if (osmTags?.wikidata !== undefined && osmTags.wikidata.trim() !== "") {
      const resolvedUrl = await resolveWikidataToWikipediaUrl(
        this.fastify,
        osmTags.wikidata,
      );
      tagUrls.push(resolvedUrl);
    }

    this.fastify.log.info(
      {
        poiId,
        tagUrlCount: tagUrls.length,
        hasWikipedia:
          osmTags?.wikipedia !== undefined && osmTags.wikipedia.trim() !== "",
        hasWikidata:
          osmTags?.wikidata !== undefined && osmTags.wikidata.trim() !== "",
      },
      "Jina enrichment: tag URLs step",
    );

    // 3. Deduplicate by canonical key (hostname + normalized pathname)
    // Tag URLs first (priority), then search URLs. Same-page variants (casing, encoding) are merged.
    const seenKeys = new Set<string>();
    const allUrls: string[] = [];

    for (const url of [...tagUrls, ...jinaSearchUrls]) {
      const key = getCanonicalUrlKey(url);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allUrls.push(url);
      }
    }

    // 4. Filter: skip blacklisted, keep topN
    const filteredUrls: string[] = [];
    for (const url of allUrls) {
      if (filteredUrls.length >= topN) break;
      if (!isBlacklisted(url, urlBlacklist)) {
        filteredUrls.push(url);
      }
    }

    const blacklistedCount = allUrls.filter((u) =>
      isBlacklisted(u, urlBlacklist),
    ).length;

    this.fastify.log.info(
      {
        poiId,
        filteredCount: filteredUrls.length,
        blacklistedCount,
        allUrlsCount: allUrls.length,
      },
      "Jina enrichment: filter step",
    );

    // 5. Jina Reader: fetch each URL in parallel
    const jinaReaderProcessor = new JinaReaderProcessor();
    const jinaReaderResults = await Promise.allSettled(
      filteredUrls.map((url) =>
        orchestrator.process(jinaReaderProcessor, {
          targetId: poiId,
          params: { url },
          batchId,
          cacheByUrl: url,
        }),
      ),
    );

    // 6. Collect successful Jina Reader results
    const readerPages: ReaderPageResult[] = [];
    for (let i = 0; i < jinaReaderResults.length; i++) {
      const settled = jinaReaderResults[i];
      const url = filteredUrls[i] ?? "";

      if (settled === undefined || settled.status === "rejected") {
        this.fastify.log.warn(
          { url, reason: settled?.reason },
          "Jina Reader call rejected",
        );
        continue;
      }

      const processResult = settled.value;
      if (!isProcessSuccess(processResult)) {
        this.fastify.log.warn(
          { url, error: processResult.error },
          "Jina Reader processing failed, skipping",
        );
        continue;
      }

      const scrapeResponse = processResult.scrapeResponse;
      if (!isScrapingSuccess(scrapeResponse)) {
        this.fastify.log.warn(
          { url, error: scrapeResponse.error },
          "Jina Reader returned error, skipping",
        );
        continue;
      }

      const source = detectSource(url);

      readerPages.push({
        title: scrapeResponse.title,
        content: scrapeResponse.content,
        url,
        source,
      });
    }

    // Log reader summary (including failures from the loop above)
    const readerSuccessCount = readerPages.length;
    const readerWithContentCount = readerPages.filter(
      (p) => typeof p.content === "string" && p.content.length > 0,
    ).length;

    this.fastify.log.info(
      {
        poiId,
        totalUrls: filteredUrls.length,
        readerSuccessCount,
        readerWithContentCount,
      },
      "Jina enrichment: reader summary",
    );

    // 7. Aggregate and truncate (100k total, 50k per item)
    const contentItems: ContentItem[] = readerPages.map((p) => ({
      content: p.content,
      source: p.source,
      title: p.title,
      url: p.url,
    }));

    const truncated = truncateContentBySource(contentItems, 100_000, 50_000);

    return {
      webContent: truncated.web,
      wikipediaContent: truncated.wikipedia,
      wikidataContent: truncated.wikidata,
      diagnostic: {
        searchUrlCount: jinaSearchUrls.length,
        tagUrlCount: tagUrls.length,
        filteredCount: filteredUrls.length,
        blacklistedCount,
        readerSuccessCount,
        readerWithContentCount,
      },
    };
  }
}
