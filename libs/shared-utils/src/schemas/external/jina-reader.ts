import { type Static, Type } from "typebox";

// On a créé ces types depuis le repo jina-ai/reader avec deepkwiki en demandant un schéma OpenAPI

/**
 * --- CONFIGURATION DU CRAWLER (Headers) ---
 * Ces en-têtes contrôlent le comportement du moteur de rendu et du parsing de r.jina.ai.
 */
export const ReaderHeadersSchema = Type.Object(
  {
    Accept: Type.Optional(
      Type.String({
        description: "text/event-stream, application/json, text/plain",
      }),
    ),
    Authorization: Type.Optional(
      Type.String({
        description: "Bearer {token}",
      }),
    ),
    "X-Respond-With": Type.Optional(
      Type.Union(
        [
          Type.Literal("markdown"),
          Type.Literal("html"),
          Type.Literal("text"),
          Type.Literal("pageshot"),
          Type.Literal("screenshot"),
          Type.Literal("content"),
          Type.Literal("readerlm-v2"),
          Type.Literal("vlm"),
        ],
        { description: "Default: content", default: "content" },
      ),
    ),
    // Cache et Proxy
    "X-Cache-Tolerance": Type.Optional(Type.String()),
    "X-No-Cache": Type.Optional(Type.String()),
    "X-Proxy-Url": Type.Optional(Type.String()),
    "X-Proxy": Type.Optional(Type.String()),
    "X-Robots-Txt": Type.Optional(Type.String()),
    DNT: Type.Optional(
      Type.String({ description: "1 pour désactiver le cache système" }),
    ),
    // Sélecteurs et Dom
    "X-Wait-For-Selector": Type.Optional(Type.String()),
    "X-Target-Selector": Type.Optional(Type.String()),
    "X-Remove-Selector": Type.Optional(Type.String()),
    "X-Set-Cookie": Type.Optional(Type.String()),
    "X-With-Iframe": Type.Optional(Type.String()),
    "X-With-Shadow-Dom": Type.Optional(Type.String()),
    // Images et Contenu
    "X-Keep-Img-Data-Url": Type.Optional(Type.String()),
    "X-With-Generated-Alt": Type.Optional(Type.String()),
    "X-With-Images-Summary": Type.Optional(Type.String()),
    "X-With-links-Summary": Type.Optional(Type.String()),
    "X-Retain-Images": Type.Optional(
      Type.Union([
        Type.Literal("none"),
        Type.Literal("all"),
        Type.Literal("alt"),
        Type.Literal("all_p"),
        Type.Literal("alt_p"),
      ]),
    ),
    // Environnement Browser
    "X-User-Agent": Type.Optional(Type.String()),
    "X-Timeout": Type.Optional(Type.String()),
    "X-Locale": Type.Optional(Type.String()),
    "X-Referer": Type.Optional(Type.String()),
    "X-Token-Budget": Type.Optional(Type.String()),
    // Engine & Timing
    "X-Respond-Timing": Type.Optional(
      Type.Union([
        Type.Literal("html"),
        Type.Literal("visible-content"),
        Type.Literal("mutation-idle"),
        Type.Literal("resource-idle"),
        Type.Literal("media-idle"),
        Type.Literal("network-idle"),
      ]),
    ),
    "X-Engine": Type.Optional(
      Type.Union([
        Type.Literal("auto"),
        Type.Literal("browser"),
        Type.Literal("curl"),
        Type.Literal("cf-browser-rendering"),
      ]),
    ),
    "X-Base": Type.Optional(
      Type.Union([Type.Literal("initial"), Type.Literal("final")]),
    ),
    // Style Markdown
    "X-Md-Heading-Style": Type.Optional(
      Type.Union([Type.Literal("setext"), Type.Literal("atx")]),
    ),
    "X-Md-Hr": Type.Optional(Type.String()),
    "X-Md-Bullet-List-Marker": Type.Optional(
      Type.Union([Type.Literal("-"), Type.Literal("+"), Type.Literal("*")]),
    ),
    "X-Md-Em-Delimiter": Type.Optional(
      Type.Union([Type.Literal("_"), Type.Literal("*")]),
    ),
    "X-Md-Strong-Delimiter": Type.Optional(Type.String()),
    "X-Md-Link-Style": Type.Optional(Type.String()),
    "X-Md-Link-Reference-Style": Type.Optional(Type.String()),
  },
  { $id: "ReaderHeaders" },
);

/**
 * --- INPUT - Body POST ---
 * POST https://r.jina.ai/ avec body { url: string }
 * Utilisé pour les SPA avec hash routing (#/route)
 */
export const PostCrawlBodySchema = Type.Object(
  {
    url: Type.String({ format: "uri", description: "URL à crawler" }),
  },
  { $id: "PostCrawlBody" },
);

/**
 * --- OUTPUT - Composants de réponse ---
 */
export const UsageMetaSchema = Type.Object(
  {
    tokens: Type.Optional(Type.Integer()),
  },
  { $id: "UsageMeta" },
);

export const ImgBriefSchema = Type.Object(
  {
    src: Type.Optional(Type.String()),
    loaded: Type.Optional(Type.Boolean()),
    width: Type.Optional(Type.Integer()),
    height: Type.Optional(Type.Integer()),
    naturalWidth: Type.Optional(Type.Integer()),
    naturalHeight: Type.Optional(Type.Integer()),
    alt: Type.Optional(Type.String()),
  },
  { $id: "ImgBrief" },
);

export const FormattedPageSchema = Type.Object(
  {
    url: Type.String(),
    title: Type.String(),
    content: Type.String(),
    description: Type.Optional(Type.String()),
    html: Type.Optional(Type.String()),
    text: Type.Optional(Type.String()),
    links: Type.Optional(
      Type.Array(Type.Tuple([Type.String(), Type.String()]), {
        description: "Tableau de [url, title]",
      }),
    ),
    imgs: Type.Optional(Type.Array(ImgBriefSchema)),
    usage: Type.Optional(UsageMetaSchema),
    warning: Type.Optional(Type.String()),
    publishedTime: Type.Optional(Type.String()),
    screenshotUrl: Type.Optional(Type.String()),
    pageshotUrl: Type.Optional(Type.String()),
  },
  { $id: "FormattedPage" },
);

export const CrawlResponseSchema = Type.Union(
  [
    FormattedPageSchema,
    Type.String({ description: "Contenu Markdown/Texte brut" }),
  ],
  { $id: "CrawlResponse" },
);

/**
 * --- TYPES STATIQUES ---
 */
export type ReaderHeaders = Static<typeof ReaderHeadersSchema>;
export type FormattedPage = Static<typeof FormattedPageSchema>;
export type CrawlResponse = Static<typeof CrawlResponseSchema>;
export type PostCrawlBody = Static<typeof PostCrawlBodySchema>;
export type UsageMeta = Static<typeof UsageMetaSchema>;
export type ImgBrief = Static<typeof ImgBriefSchema>;
