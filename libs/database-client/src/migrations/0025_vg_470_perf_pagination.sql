-- Pre-fix: redefine normalize_search_text before ALTER TABLE triggers recompilation.
-- Without this, ALTER TABLE "boundaries" ALTER COLUMN crashes with
-- "function unaccent(text) does not exist" because the search_path at
-- function-recompile time does not include the schema where unaccent lives.
-- (The permanent fix lands in 0026; this block makes 0025 safe on any fresh env.)
CREATE SCHEMA IF NOT EXISTS extensions;
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "user_period_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(1000) NOT NULL,
	"period_type" varchar(50) NOT NULL,
	"period_key" varchar(32) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_processing_results_updated_at";--> statement-breakpoint
DROP INDEX "user_locations_user_id_timestamp_idx";--> statement-breakpoint
DROP INDEX "user_locations_timestamp_idx";--> statement-breakpoint
ALTER TABLE "app_review" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "app_review" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "app_review" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "app_review" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "boundaries" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "boundaries" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "boundaries" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "boundaries" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "poi_boundaries" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "poi_boundaries" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "poi_boundaries" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "poi_boundaries" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "poi_data" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "poi_data" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "poi_data" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "poi_data" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "poi_enriched" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "poi_enriched" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "poi_enriched" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "poi_enriched" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pois" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "pois" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pois" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "pois" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "processing_results" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "processing_results" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "processing_results" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "processing_results" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "push_devices" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "push_devices" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "push_devices" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "push_devices" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_feedbacks" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "user_feedbacks" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_locations" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "user_locations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_locations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "user_locations" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_locations" ALTER COLUMN "timestamp" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_login" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_login" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "visited_pois" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "visited_pois" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "visited_pois" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "visited_pois" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "pois" ADD COLUMN "visit_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_feedbacks" ADD COLUMN "updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_period_scores" ADD CONSTRAINT "user_period_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "user_period_scores_uniq" ON "user_period_scores" USING btree ("user_id" text_ops,"period_type" text_ops,"period_key" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_period_scores_leaderboard" ON "user_period_scores" USING btree ("period_type" text_ops,"period_key" text_ops,"count" DESC NULLS LAST,"user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_visited_pois_user_id_created_at_id" ON "visited_pois" USING btree ("user_id" text_ops,"created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_visited_pois_poi_id_created_at_id" ON "visited_pois" USING btree ("poi_id" text_ops,"created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
-- drizzle-kit génère ces CREATE INDEX sans les modifiers DESC NULLS LAST
-- présents dans le schema.ts (cf. .op("timestamptz_ops") + .desc().nullsLast()).
-- Correction manuelle pour préserver l'ordre des index. À regénérer si bug fixé upstream.
CREATE INDEX "idx_processing_results_updated_at" ON "processing_results" USING btree ("updated_at" timestamptz_ops DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_locations_user_id_timestamp_idx" ON "user_locations" USING btree ("user_id" text_ops,"timestamp" timestamptz_ops DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_locations_timestamp_idx" ON "user_locations" USING btree ("timestamp" timestamptz_ops DESC NULLS LAST);