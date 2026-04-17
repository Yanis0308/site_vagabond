-- This script has been created in April 2026 as example purpose, it will probably not work as expected in the future and should be updated.

-- =============================================================================
-- Restore a deleted user account from the archive table
-- =============================================================================
-- Usage: replace :user_id with the actual Firebase user ID, then run the script
--
--   psql $DATABASE_URL -v user_id="'firebase_uid_xxx'" -f restore-user.sql
--
-- Or interactively in psql:
--   \set user_id 'firebase_uid_xxx'
--   \i restore-user.sql
--
-- NOTE: After running this script, re-enable the Firebase account:
--   Firebase Console → Authentication → Users → find the user → Enable
--   Or via Firebase Admin SDK: getAuth().updateUser(uid, { disabled: false })
-- =============================================================================

BEGIN;

-- 1. Verify the user exists in the archive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM archive
    WHERE table_name = 'users' AND record_id = :'user_id'
  ) THEN
    RAISE EXCEPTION 'No archived user found with id = %', :'user_id';
  END IF;
END $$;

-- 2. Restore the user row
INSERT INTO users (
  user_id,
  created_at,
  updated_at,
  email,
  full_name,
  nickname,
  oauth_providers,
  last_login,
  role
)
SELECT
  (data->>'user_id'),
  (data->>'created_at')::timestamp,
  now(),
  (data->>'email'),
  (data->>'full_name'),
  (data->>'nickname'),
  CASE
    WHEN data->'oauth_providers' IS NOT NULL
    THEN ARRAY(SELECT jsonb_array_elements_text(data->'oauth_providers'))
    ELSE NULL
  END,
  (data->>'last_login')::timestamp,
  (data->>'role')::"RoleEnum"
FROM archive
WHERE table_name = 'users' AND record_id = :'user_id'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Restore visited_pois
INSERT INTO visited_pois (
  id,
  created_at,
  updated_at,
  coords,
  poi_id,
  user_id,
  comment,
  image_key,
  image_source,
  rating
)
SELECT
  (data->>'id')::integer,
  (data->>'created_at')::timestamp,
  (data->>'updated_at')::timestamp,
  CASE
    WHEN data->>'coords' IS NOT NULL
    THEN ST_GeomFromGeoJSON(data->>'coords')
    ELSE NULL
  END,
  (data->>'poi_id'),
  (data->>'user_id'),
  (data->>'comment'),
  (data->>'image_key'),
  (data->>'image_source')::"ImageSourceEnum",
  (data->>'rating')::integer
FROM archive
WHERE table_name = 'visited_pois'
  AND caused_by_table = 'users'
  AND caused_by_id = :'user_id'
ON CONFLICT (user_id, poi_id) DO NOTHING;

-- 4. Restore user_locations
INSERT INTO user_locations (
  id,
  created_at,
  updated_at,
  user_id,
  coords,
  accuracy,
  altitude,
  altitude_accuracy,
  heading,
  speed,
  "timestamp"
)
SELECT
  (data->>'id')::integer,
  (data->>'created_at')::timestamp,
  (data->>'updated_at')::timestamp,
  (data->>'user_id'),
  ST_GeomFromGeoJSON(data->>'coords'),
  NULLIF(data->>'accuracy', 'null')::double precision,
  NULLIF(data->>'altitude', 'null')::double precision,
  NULLIF(data->>'altitude_accuracy', 'null')::double precision,
  NULLIF(data->>'heading', 'null')::double precision,
  NULLIF(data->>'speed', 'null')::double precision,
  (data->>'timestamp')::timestamp
FROM archive
WHERE table_name = 'user_locations'
  AND caused_by_table = 'users'
  AND caused_by_id = :'user_id'
ON CONFLICT DO NOTHING;

-- 5. Restore app_review
INSERT INTO app_review (
  id,
  user_id,
  positive,
  comment,
  created_at,
  updated_at
)
SELECT
  (data->>'id')::integer,
  (data->>'user_id'),
  (data->>'positive')::boolean,
  (data->>'comment'),
  (data->>'created_at')::timestamp,
  (data->>'updated_at')::timestamp
FROM archive
WHERE table_name = 'app_review'
  AND caused_by_table = 'users'
  AND caused_by_id = :'user_id'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Summary
SELECT
  table_name,
  count(*) AS rows_restored
FROM archive
WHERE caused_by_table = 'users'
  AND caused_by_id = :'user_id'
GROUP BY table_name
ORDER BY table_name;

COMMIT;
