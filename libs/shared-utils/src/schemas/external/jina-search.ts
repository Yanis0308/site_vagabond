import { type Static, Type } from "typebox";

import { ImgBriefSchema, UsageMetaSchema } from "./jina-reader.js";

// On a créé ces types depuis le repo jina-ai/reader avec deepkwiki en demandant un schéma OpenAPI

/**
 * --- PARAMÈTRES DE RECHERCHE ---
 */
export const SearchTypeEnumSchema = Type.Union(
  [Type.Literal("web"), Type.Literal("images"), Type.Literal("news")],
  { $id: "SearchType", default: "web" },
);
export type SearchTypeEnum = Static<typeof SearchTypeEnumSchema>;

export const SearchProviderEnumSchema = Type.Union(
  [Type.Literal("google"), Type.Literal("bing")],
  { $id: "SearchProvider" },
);
export type SearchProviderEnum = Static<typeof SearchProviderEnumSchema>;

/**
 * Options utilisées dans les Query Params et Request Bodies.
 * Inclut 'count' spécifique au SearcherHost.
 */
export const SearchOptionsSchema = Type.Object(
  {
    q: Type.Optional(Type.String({ description: "Requête de recherche" })),
    type: Type.Optional(SearchTypeEnumSchema),
    provider: Type.Optional(SearchProviderEnumSchema),
    num: Type.Optional(
      Type.Integer({
        minimum: 0,
        maximum: 20,
        description: "Nombre de résultats demandés au moteur",
      }),
    ),
    count: Type.Optional(
      Type.Integer({
        minimum: 0,
        maximum: 20,
        description: "Nombre de résultats à crawler (SearcherHost)",
      }),
    ),
    gl: Type.Optional(Type.String({ description: "Code pays (Geolocation)" })),
    hl: Type.Optional(
      Type.String({ description: "Code langue (Host Language)" }),
    ),
    location: Type.Optional(
      Type.String({ description: "Localisation précise" }),
    ),
    page: Type.Optional(Type.Integer({ description: "Numéro de page" })),
    fallback: Type.Optional(
      Type.Boolean({
        description: "Activer le fallback si aucun résultat",
        default: true,
      }),
    ),
  },
  { $id: "SearchOptions" },
);

/**
 * Params for s.jina.ai search (used by jina-client)
 */
export const JinaSearchParamsSchema = Type.Object(
  {
    query: Type.String({ description: "Search query" }),
    gl: Type.String({ description: "Country code (e.g. FR)" }),
    num: Type.Integer({ minimum: 1, maximum: 20, default: 5 }),
  },
  { $id: "JinaSearchParams" },
);

/**
 * --- COMPOSANTS DE RÉPONSE ---
 */

/**
 * Résultat de recherche simple (SerpHost)
 */
export const JinaSearchResultSchema = Type.Object(
  {
    title: Type.String(),
    url: Type.String({ format: "uri" }),
    description: Type.String(),
    favicon: Type.Optional(Type.String()),
    date: Type.Optional(Type.String()),
    imageUrl: Type.Optional(Type.String()),
    imageWidth: Type.Optional(Type.Integer()),
    imageHeight: Type.Optional(Type.Integer()),
    source: Type.Optional(Type.String()),
    siteLinks: Type.Optional(
      Type.Array(Type.Record(Type.String(), Type.Unknown())),
    ),
    usage: Type.Optional(UsageMetaSchema),
  },
  { $id: "JinaSearchResult" },
);

/**
 * Résultat de recherche enrichi avec contenu (SearcherHost)
 */
export const SearchResultWithContentSchema = Type.Intersect(
  [
    JinaSearchResultSchema,
    Type.Object({
      content: Type.Optional(Type.String()),
      html: Type.Optional(Type.String()),
      text: Type.Optional(Type.String()),
      links: Type.Optional(
        Type.Array(Type.Tuple([Type.String(), Type.String()]), {
          description: "Tableau de [url, title]",
        }),
      ),
      imgs: Type.Optional(Type.Array(ImgBriefSchema)),
      publishedTime: Type.Optional(Type.String()),
      screenshotUrl: Type.Optional(Type.String()),
      pageshotUrl: Type.Optional(Type.String()),
    }),
  ],
  { $id: "SearchResultWithContent" },
);

/**
 * --- ENVELOPPE DE RÉPONSE API (Standard Jina) ---
 * Le champ 'data' contient uniquement les items, pas l'objet complet.
 */
export const JinaApiResponseSchema = Type.Object(
  {
    code: Type.Integer({ description: "HTTP Status Code" }),
    status: Type.Integer({ description: "Internal Jina Status Code" }),
    data: Type.Optional(
      Type.Union([
        Type.Array(JinaSearchResultSchema),
        Type.Array(SearchResultWithContentSchema),
      ]),
    ),
    usage: Type.Optional(UsageMetaSchema),
    meta: Type.Optional(
      Type.Object({
        usage: Type.Optional(UsageMetaSchema),
      }),
    ),
  },
  { $id: "JinaApiResponse" },
);

/**
 * --- STRUCTURES SSE (Server-Sent Events) ---
 */
export const SearchEventMetaSchema = Type.Object(
  {
    event: Type.Literal("meta"),
    data: Type.Object({
      fallback: Type.Optional(Type.String()),
    }),
  },
  { $id: "SearchEventMeta" },
);

export const SearchEventDataSchema = Type.Object(
  {
    event: Type.Literal("data"),
    data: Type.Union([
      JinaSearchResultSchema,
      SearchResultWithContentSchema,
      Type.Array(JinaSearchResultSchema),
      Type.Array(SearchResultWithContentSchema),
    ]),
  },
  { $id: "SearchEventData" },
);

export const SearchEventErrorSchema = Type.Object(
  {
    event: Type.Literal("error"),
    data: Type.Object(
      {
        message: Type.String(),
        stack: Type.Optional(Type.String()),
      },
      { additionalProperties: true },
    ),
  },
  { $id: "SearchEventError" },
);

export const SearchSSEEventSchema = Type.Union(
  [SearchEventMetaSchema, SearchEventDataSchema, SearchEventErrorSchema],
  { $id: "SearchSSEEvent" },
);

/**
 * --- TYPES STATIQUES ---
 */
export type SearchOptions = Static<typeof SearchOptionsSchema>;
export type JinaSearchParams = Static<typeof JinaSearchParamsSchema>;
export type JinaApiResponse = Static<typeof JinaApiResponseSchema>;
export interface JinaScrapeSuccessData {
  data: JinaApiResponse;
  usage?: { tokens?: number };
  meta?: {
    code?: number;
    status?: number;
    usage?: { tokens?: number };
  };
}
export type JinaSearchResult = Static<typeof JinaSearchResultSchema>;
export type SearchResultWithContent = Static<
  typeof SearchResultWithContentSchema
>;
export type SearchSSEEvent = Static<typeof SearchSSEEventSchema>;
