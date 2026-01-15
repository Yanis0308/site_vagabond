/**
 * Type guards for runtime type checking
 */
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Navigate through nested JSON structures using index paths
 */
export function getNthElement(
  arr: unknown[],
  path: number | number[],
  defaultValue: unknown,
): unknown {
  if (!isArray(arr)) {
    return defaultValue;
  }

  const indexes = Array.isArray(path) ? path : [path];
  let current: unknown = arr;

  for (const index of indexes) {
    if (
      !isArray(current) ||
      index >= current.length ||
      current[index] === null ||
      current[index] === undefined
    ) {
      return defaultValue;
    }
    current = current[index];
  }

  return current;
}

/**
 * Get string value from nested path, with type safety
 */
export function getNthString(
  arr: unknown[],
  path: number | number[],
  defaultValue: string,
): string {
  const value = getNthElement(arr, path, defaultValue);
  return isString(value) ? value : defaultValue;
}

/**
 * Get number value from nested path, with type safety
 */
export function getNthNumber(
  arr: unknown[],
  path: number | number[],
  defaultValue: number,
): number {
  const value = getNthElement(arr, path, defaultValue);
  return isNumber(value) ? value : defaultValue;
}

/**
 * Get array value from nested path, with type safety
 */
export function getNthArray(
  arr: unknown[],
  path: number | number[],
  defaultValue: unknown[],
): unknown[] {
  const value = getNthElement(arr, path, defaultValue);
  return isArray(value) ? value : defaultValue;
}

/**
 * Extract actual URL from Google redirect URL
 */
export function extractActualURL(googleURL: string): string {
  if (!googleURL.startsWith("/url?q=")) {
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
    const decoded: unknown = JSON.parse(`"${url.replace(/"/g, '\\"')}"`);
    return isString(decoded) ? decoded : url;
  } catch {
    return url;
  }
}
