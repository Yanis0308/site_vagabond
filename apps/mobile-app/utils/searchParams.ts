export const normalizeStringSearchParam = (
  value: string | string[] | undefined,
): string | null => {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (normalized === undefined) {
    return null;
  }

  const trimmed = normalized.trim();

  return trimmed === "" ? null : trimmed;
};
