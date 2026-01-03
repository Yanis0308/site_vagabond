/**
 * Navigate through nested JSON structures using index paths
 */
export function getNthElement(
  arr: unknown[],
  path: number | number[],
  defaultValue: unknown,
): unknown {
  if (!Array.isArray(arr)) {
    return defaultValue;
  }

  const indexes = Array.isArray(path) ? path : [path];
  let current: unknown[] = arr;

  for (const index of indexes) {
    if (
      !Array.isArray(current) ||
      index >= current.length ||
      current[index] === null ||
      current[index] === undefined
    ) {
      return defaultValue;
    }
    current = current[index] as unknown[];
  }

  return current;
}

/**
 * Extract actual URL from Google redirect URL
 */
export function extractActualURL(googleURL: string): string {
  if (!googleURL?.startsWith("/url?q=")) {
    return googleURL;
  }

  try {
    const url = new URL(googleURL, "https://www.google.com");
    return url.searchParams.get("q") ?? googleURL;
  } catch {
    return googleURL;
  }
}

/**
 * Decode URL that may be encoded with quotes
 */
export function decodeURL(url: string): string {
  // URLs may be encoded with quotes
  try {
    return JSON.parse(`"${url.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return url;
  }
}
