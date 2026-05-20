-- Hardening: address Supabase Security Advisor warnings
--
-- - "Function Search Path Mutable": normalize_search_text, archive_on_delete,
--   archive_user_on_delete are rewritten with `SET search_path = ''` and fully
--   schema-qualified references. This eliminates the search_path-dependent
--   resolution that crashed migration 0025 when ALTER COLUMN on `boundaries`
--   triggered recompilation of the `idx_boundaries_name_normalized` expression
--   index (function unaccent(text) does not exist).
--
-- - "Extension in Public": unaccent is moved from `public` to the `extensions`
--   schema. postgis is intentionally left in place (moving it would invalidate
--   too many dependent objects and is not recommended by Supabase).
--
-- Order matters: functions are redefined first so their bodies reference the
-- new schema location, then the extension is moved. The ALTER EXTENSION is
-- wrapped in a conditional block so this migration can be safely re-applied
-- (e.g. when manually pre-applied on an environment blocked by 0025).
CREATE OR REPLACE FUNCTION public.normalize_search_text(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  RETURN pg_catalog.regexp_replace(
    pg_catalog.lower(extensions.unaccent(input_text)),
    '[^a-z0-9]', '', 'g'
  );
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.archive_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    cause_table TEXT;
    cause_id TEXT;
BEGIN
    cause_table := pg_catalog.current_setting('archive.cause_table', true);
    cause_id := pg_catalog.current_setting('archive.cause_id', true);

    IF cause_table IS NULL OR cause_table = '' THEN
        PERFORM pg_catalog.set_config('archive.cause_table', TG_TABLE_NAME, true);
        PERFORM pg_catalog.set_config('archive.cause_id', OLD.id::TEXT, true);
        cause_table := TG_TABLE_NAME;
        cause_id := OLD.id::TEXT;
    END IF;

    INSERT INTO public.archive (table_name, record_id, data, caused_by_table, caused_by_id)
    VALUES (
        TG_TABLE_NAME,
        OLD.id::TEXT,
        pg_catalog.to_jsonb(OLD),
        cause_table,
        cause_id
    );

    RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.archive_user_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    PERFORM pg_catalog.set_config('archive.cause_table', 'users', true);
    PERFORM pg_catalog.set_config('archive.cause_id', OLD.user_id, true);

    INSERT INTO public.archive (table_name, record_id, data, caused_by_table, caused_by_id)
    VALUES (
        'users',
        OLD.user_id,
        pg_catalog.to_jsonb(OLD),
        'users',
        OLD.user_id
    );

    RETURN OLD;
END;
$$;
--> statement-breakpoint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = 'unaccent' AND n.nspname = 'public'
    ) THEN
        ALTER EXTENSION unaccent SET SCHEMA extensions;
    END IF;
END $$;
