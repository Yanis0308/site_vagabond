/**
 * Extract fun facts from enriched data and map them to database format
 */
export function mapFunFactsToDbFormat(
  funFacts: string[] | undefined | null,
): Array<{ content: string; order: number }> {
  const result: Array<{ content: string; order: number }> = [];
  if (funFacts !== null && funFacts !== undefined && Array.isArray(funFacts)) {
    funFacts.forEach((fact, index) => {
      if (typeof fact === "string") {
        result.push({
          content: fact,
          order: index,
        });
      }
    });
  }
  return result;
}
