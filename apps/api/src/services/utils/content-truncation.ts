import { countTokens, decode, encode } from "gpt-tokenizer";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { map } from "unist-util-map";
import { remove } from "unist-util-remove";
import { visit } from "unist-util-visit";

import { log } from "../../lib/logger.js";

export type ContentSource = "wikipedia" | "wikidata" | "web";

export interface ContentItem {
  content: string;
  source: ContentSource;
  title?: string;
  url?: string;
}

export interface ExtractedImage {
  alt: string;
  url: string;
}

export interface TruncatedSourceItem {
  url: string;
  content: string;
  title?: string;
  images?: ExtractedImage[];
}

const MAX_IMAGES_PER_SOURCE = 50;

/** Sort images by alt length (longest first) and limit to MAX_IMAGES_PER_SOURCE. */
function sortAndLimitImages(images: ExtractedImage[]): ExtractedImage[] {
  return [...images]
    .sort((a, b) => b.alt.length - a.alt.length)
    .slice(0, MAX_IMAGES_PER_SOURCE);
}

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function parseImageUrl(url: string): URL | null {
  try {
    const toParse = /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
      ? url
      : `https://${url}`;
    return new URL(toParse);
  } catch {
    return null;
  }
}

function isLocalhostUrl(url: string): boolean {
  const parsed = parseImageUrl(url);
  return (
    parsed !== null && LOCALHOST_HOSTNAMES.has(parsed.hostname.toLowerCase())
  );
}

function pathnameEndsWith(url: string, ext: string): boolean {
  const parsed = parseImageUrl(url);
  return (parsed?.pathname ?? "").toLowerCase().endsWith(ext);
}

/** URL patterns to exclude from extracted images (logos, local, inline). All images are removed from content. Expects lowercased URL. */
const EXCLUDED_IMAGE_PATTERNS: Array<(urlLower: string) => boolean> = [
  (u): boolean => pathnameEndsWith(u, ".svg"),
  (u): boolean => pathnameEndsWith(u, ".ico"),
  (u): boolean => isLocalhostUrl(u),
  (u): boolean => u.startsWith("blob:"),
  (u): boolean => u.startsWith("data:"),
];

function isExcludedImageUrl(url: string): boolean {
  if (typeof url !== "string" || url.trim().length === 0) return true;
  const urlLower = url.toLowerCase();
  return EXCLUDED_IMAGE_PATTERNS.some((test) => test(urlLower));
}

/** Remove "Image XX: " or "Image XX" prefix from alt text (e.g. Jina Reader format). */
function normalizeImageAlt(alt: string): string {
  return alt.replace(/^Image \d+(?::\s*)?/, "").trim();
}

interface UnistNode {
  type?: string;
  value?: string;
  url?: string;
  children?: UnistNode[];
}

/** Recursively extract plain text from an mdast node (handles text, strong, emphasis, etc.). */
function extractTextFromNode(node: UnistNode): string {
  if (node.type === "text" && typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join("");
  }
  return "";
}

/**
 * Replace link nodes with their text content (remove URLs, keep link text).
 * Uses unist-util-map to transform the tree.
 */
function replaceLinksWithText<T extends UnistNode>(tree: T): T {
  const mapped = map(tree as Parameters<typeof map>[0], (node) => {
    if ((node as UnistNode).type === "link") {
      const text = extractTextFromNode(node);
      return { type: "text", value: text };
    }
    return node;
  });
  return mapped as T;
}

/**
 * Extract images from Markdown content, remove them from the text, and filter out excluded URLs.
 * Also replaces links with their text content (no URLs) for LLM token optimization.
 * Returns cleaned content and array of non-excluded images.
 */
export function processMarkdownForLLM(content: string): {
  content: string;
  images: ExtractedImage[];
} {
  try {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(content);

    const images: ExtractedImage[] = [];

    // 1. Collect non-excluded images before removal
    visit(tree, "image", (node) => {
      const imageNode = node as { type: string; url: string; alt?: string };
      if (!isExcludedImageUrl(imageNode.url)) {
        images.push({
          alt: normalizeImageAlt(imageNode.alt ?? ""),
          url: imageNode.url,
        });
      }
    });

    // 2. Remove all image nodes (reliable, no index bugs)
    remove(tree, "image");

    // 3. Replace links with their text content (no URLs) for LLM optimization
    const treeWithoutLinks = replaceLinksWithText(tree);

    // 4. Stringify (remarkGfm required: Wikipedia tables produce `table` nodes that remark-stringify cannot serialize without it)
    let cleanedContent = unified()
      .use(remarkStringify)
      .use(remarkGfm)
      .stringify(treeWithoutLinks);

    // 5. Post-treatment: &#x20; (HTML entity for space) -> space
    cleanedContent = cleanedContent.replace(/&#x20;/g, " ");

    // 6. Collapse excessive newlines from empty links
    cleanedContent = cleanedContent.replace(/\n{3,}/g, "\n\n");

    return { content: cleanedContent, images };
  } catch (error) {
    log.error(
      {
        contentLength: content.length,
        error:
          error instanceof Error
            ? { message: error.message, name: error.name, stack: error.stack }
            : String(error),
      },
      "[processMarkdownForLLM] remark processing failed, returning original content",
    );
    return { content, images: [] };
  }
}

/**
 * Count tokens using gpt-tokenizer (o200k_base encoding for GPT-4o and newer).
 */
export function estimateTokens(text: string): number {
  return countTokens(text);
}

/**
 * Truncate a single content string to a max token count.
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const tokens = encode(text);
  if (tokens.length <= maxTokens) return text;
  return decode(tokens.slice(0, maxTokens));
}

/**
 * Aggregate and truncate content from multiple sources.
 * Priority: wikipedia, then wikidata, then web.
 * Each item is limited to maxPerItem tokens.
 * Total is limited to maxTokens.
 * Excludes items without content.
 */
export function truncateContentBySource(
  items: ContentItem[],
  maxTokens: number,
  maxPerItem: number,
): {
  wikipedia: TruncatedSourceItem[];
  wikidata: TruncatedSourceItem[];
  web: TruncatedSourceItem[];
} {
  const result: Record<ContentSource, TruncatedSourceItem[]> = {
    wikipedia: [],
    wikidata: [],
    web: [],
  };

  let totalTokensUsed = 0;
  const order: ContentSource[] = ["wikipedia", "wikidata", "web"] as const;

  for (const source of order) {
    const sourceItems = items.filter((i) => i.source === source);

    for (const item of sourceItems) {
      if (totalTokensUsed >= maxTokens) break;

      // Exclude items without content
      const content = typeof item.content === "string" ? item.content : "";
      if (content.trim().length === 0) continue;

      // Extract images before token counting (removes images, filters .svg/.ico/localhost/blob)
      const { content: cleanedContent, images } =
        processMarkdownForLLM(content);
      const sortedImages = sortAndLimitImages(images);

      const truncatedContent = truncateToTokens(cleanedContent, maxPerItem);
      const itemTokens = countTokens(truncatedContent);
      const url = typeof item.url === "string" ? item.url : "";

      result[source].push({
        url,
        content: truncatedContent,
        ...(item.title !== undefined &&
          item.title !== "" && { title: item.title }),
        ...(sortedImages.length > 0 && { images: sortedImages }),
      });
      totalTokensUsed += itemTokens;
    }
  }

  return result;
}
