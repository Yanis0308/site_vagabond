import slugify from "@sindresorhus/slugify";

const NICKNAME_SLUGIFY_OPTIONS = {
  separator: "_" as const,
  lowercase: false,
  preserveCharacters: ["-", "."],
};

/**
 * Slugify a string for use as nickname.
 * Keeps case, allows letters, digits, underscores, dashes, dots.
 * Uses underscore as separator (e.g. spaces).
 */
export const slugifyNickname = (text: string): string =>
  slugify(text, NICKNAME_SLUGIFY_OPTIONS);
