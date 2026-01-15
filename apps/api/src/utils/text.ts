/**
 * Normalizes text for comparison by:
 * 1. Removing accents
 * 2. Converting to lowercase
 * 3. Removing all special characters (keeping only alphanumeric)
 *
 * This function mimics the SQL `normalize_search_text` function behavior
 *
 * @param text - Text to normalize
 * @returns Normalized text with only lowercase alphanumeric characters
 *
 * @example
 * normalizeSearchText("Saint-Étienne") // returns "saintetienne"
 * normalizeSearchText("Musée de l'Hôtel-Dieu") // returns "museedelhôteldieu"
 */
export const normalizeSearchText = (text: string): string => {
  return (
    text
      // Normalize Unicode characters and remove accents
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Convert to lowercase
      .toLowerCase()
      // Remove all special characters (keeping only alphanumeric)
      .replace(/[^a-z0-9]/g, "")
  );
};
