-- Enable unaccent extension if not already enabled
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create function to normalize search text
-- This function:
-- 1. Removes accents using unaccent()
-- 2. Converts to lowercase
-- 3. Replaces hyphens/dashes with spaces
-- 4. Normalizes multiple spaces to single space
-- 5. Trims leading/trailing spaces
CREATE OR REPLACE FUNCTION normalize_search_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN trim(
    regexp_replace(
      replace(
        lower(unaccent(input_text)),
        '-', ' '
      ),
      '\s+', ' ', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create index on normalized poi_data.name for better performance
CREATE INDEX IF NOT EXISTS idx_poi_data_name_normalized 
ON poi_data (normalize_search_text(name));

-- Create index on normalized boundaries.name for better performance
CREATE INDEX IF NOT EXISTS idx_boundaries_name_normalized 
ON boundaries (normalize_search_text(name));

