-- Archive table: stores deleted rows as JSONB blobs, keeping live tables clean.
-- Triggers on users, visited_pois, user_locations, app_review fire BEFORE DELETE
-- and copy the row into this table. A session variable tracks cascade context so
-- child deletes know which parent deletion caused them.

CREATE TABLE "archive" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "table_name" varchar(100) NOT NULL,
    "record_id" text NOT NULL,
    "data" jsonb NOT NULL,
    "archived_at" timestamp (3) NOT NULL DEFAULT now(),
    "caused_by_table" varchar(100),
    "caused_by_id" text
);

CREATE INDEX "idx_archive_table_record" ON "archive" ("table_name", "record_id");
CREATE INDEX "idx_archive_archived_at" ON "archive" ("archived_at");
CREATE INDEX "idx_archive_caused_by" ON "archive" ("caused_by_table", "caused_by_id");

--> statement-breakpoint

CREATE OR REPLACE FUNCTION archive_on_delete()
RETURNS TRIGGER AS $$
DECLARE
    cause_table TEXT;
    cause_id TEXT;
BEGIN
    cause_table := current_setting('archive.cause_table', true);
    cause_id := current_setting('archive.cause_id', true);

    -- Top-level delete: register this row as the cascade root
    IF cause_table IS NULL OR cause_table = '' THEN
        PERFORM set_config('archive.cause_table', TG_TABLE_NAME, true);
        PERFORM set_config('archive.cause_id', OLD.id::TEXT, true);
        cause_table := TG_TABLE_NAME;
        cause_id := OLD.id::TEXT;
    END IF;

    INSERT INTO archive (table_name, record_id, data, caused_by_table, caused_by_id)
    VALUES (
        TG_TABLE_NAME,
        OLD.id::TEXT,
        to_jsonb(OLD),
        cause_table,
        cause_id
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint

-- users table uses user_id as PK (not id), so we need a dedicated function
CREATE OR REPLACE FUNCTION archive_user_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Users are always the cascade root when deleted directly
    PERFORM set_config('archive.cause_table', 'users', true);
    PERFORM set_config('archive.cause_id', OLD.user_id, true);

    INSERT INTO archive (table_name, record_id, data, caused_by_table, caused_by_id)
    VALUES (
        'users',
        OLD.user_id,
        to_jsonb(OLD),
        'users',
        OLD.user_id
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint

CREATE TRIGGER archive_users
    BEFORE DELETE ON "users"
    FOR EACH ROW EXECUTE FUNCTION archive_user_on_delete();

CREATE TRIGGER archive_visited_pois
    BEFORE DELETE ON "visited_pois"
    FOR EACH ROW EXECUTE FUNCTION archive_on_delete();

CREATE TRIGGER archive_user_locations
    BEFORE DELETE ON "user_locations"
    FOR EACH ROW EXECUTE FUNCTION archive_on_delete();

CREATE TRIGGER archive_app_review
    BEFORE DELETE ON "app_review"
    FOR EACH ROW EXECUTE FUNCTION archive_on_delete();

--> statement-breakpoint

-- Switch visited_pois.user_id from RESTRICT to CASCADE so user delete propagates
-- to child rows (triggers then archive them with caused_by=users).
ALTER TABLE "visited_pois" DROP CONSTRAINT "visited_pois_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "visited_pois" ADD CONSTRAINT "visited_pois_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;
