/** Jina Reader engine modes (X-Engine header) */
export enum JinaEngine {
  Direct = "direct",
  Browser = "browser",
}

/** Hardcoded Jina Reader config — not from env */
export const JINA_READER_CONFIG = {
  domainEngineMap: {
    "wikipedia.org": JinaEngine.Direct,
    "wikidata.org": JinaEngine.Direct,
    "wikimedia.org": JinaEngine.Direct,
  },
  defaultEngine: JinaEngine.Direct,
  topN: 10,
  urlBlacklist: [
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "linkedin.com",
    "pinterest.com",
    "reddit.com",
    "youtube.com",
  ],
} as const;
