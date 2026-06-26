export type CompareLevel = "yes" | "no";

export interface CompareAppColumn {
  id: string;
  name: string;
  isHighlight?: boolean;
}

export interface CompareCriterionRow {
  id: string;
  label: string;
  values: Record<string, CompareLevel>;
}

export function toCompareKey(id: string): string {
  return `${id.charAt(0).toUpperCase()}${id.slice(1)}`;
}
