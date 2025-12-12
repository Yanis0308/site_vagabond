-- Update normalize_search_text function to handle apostrophes and special characters
-- This function now:
-- 1. Removes accents using unaccent()
-- 2. Converts to lowercase
-- 3. Removes all special characters including apostrophes (keeping only alphanumeric)
CREATE OR REPLACE FUNCTION normalize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
      lower(unaccent(input_text)),
      '[^a-z0-9]', '', 'g'  -- Remove all special characters (including apostrophes) except alphanumeric
  );
END;

$$ LANGUAGE plpgsql IMMUTABLE;

REINDEX INDEX idx_poi_data_name_normalized;
