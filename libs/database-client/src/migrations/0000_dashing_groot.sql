-- Enable postgis extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

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

CREATE TYPE "public"."BoundaryLevelEnum" AS ENUM('COUNTRY', 'REGION', 'COUNTY', 'CITY', 'DISTRICT', 'NEIGHBORHOOD');--> statement-breakpoint
CREATE TYPE "public"."LanguageEnum" AS ENUM('EN', 'FR');--> statement-breakpoint
CREATE TYPE "public"."PoiDataSourceEnum" AS ENUM('OSM', 'AI', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."PoiFilterLevelEnum" AS ENUM('UNKNOWN', 'STRICT', 'STANDARD', 'INTERMEDIATE', 'LAXIST');--> statement-breakpoint
CREATE TYPE "public"."PoiSourceEnum" AS ENUM('OSM');--> statement-breakpoint
CREATE TYPE "public"."RoleEnum" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."VisitedPoiStatus" AS ENUM('PENDING', 'CONFIRMED');--> statement-breakpoint
CREATE TABLE "boundaries" (
	"id" varchar(1000) PRIMARY KEY NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"name" varchar(1000),
	"boundary_level" "BoundaryLevelEnum" NOT NULL,
	"raw_info" jsonb NOT NULL,
	"parent_id" varchar(1000),
	"display_point" geometry(point) NOT NULL,
	"place_type" varchar(100) NOT NULL,
	"population" integer NOT NULL,
	"is_capital" boolean NOT NULL,
	"importance_score" double precision NOT NULL,
	"way_area" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poi_boundaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"poi_id" varchar(1000) NOT NULL,
	"boundary_id" varchar(1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poi_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"name" varchar(1000) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"raw_info" jsonb NOT NULL,
	"source" "PoiDataSourceEnum" NOT NULL,
	"source_id" varchar(1000) NOT NULL,
	"language" "LanguageEnum" NOT NULL,
	"poi_id" varchar(1000) NOT NULL,
	"nb_of_tags" integer
);
--> statement-breakpoint
CREATE TABLE "pois" (
	"id" varchar(1000) PRIMARY KEY NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"source" "PoiSourceEnum" NOT NULL,
	"source_id" varchar(1000) NOT NULL,
	"coords" geometry(point) NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"disabled_reason" varchar(1000),
	"filter_level" "PoiFilterLevelEnum" DEFAULT 'UNKNOWN' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" varchar(1000) PRIMARY KEY NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"email" varchar(1000),
	"full_name" varchar(1000),
	"oauth_providers" varchar(1000)[],
	"last_login" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" "RoleEnum" DEFAULT 'USER' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visited_pois" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"coords" geometry(point),
	"poi_id" varchar(1000) NOT NULL,
	"user_id" varchar(1000) NOT NULL,
	"comment" varchar(10000) NOT NULL,
	"image_key" varchar(1000) NOT NULL,
	"rating" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "poi_boundaries" ADD CONSTRAINT "poi_boundaries_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "poi_boundaries" ADD CONSTRAINT "poi_boundaries_boundary_id_fkey" FOREIGN KEY ("boundary_id") REFERENCES "public"."boundaries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "visited_pois" ADD CONSTRAINT "visited_pois_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "boundary_display_point_index" ON "boundaries" USING gist ("display_point" gist_geometry_ops_2d);--> statement-breakpoint
CREATE INDEX "boundary_importance_index" ON "boundaries" USING btree ("importance_score" float8_ops);--> statement-breakpoint
CREATE INDEX "boundary_level_index" ON "boundaries" USING btree ("boundary_level" enum_ops);--> statement-breakpoint
CREATE INDEX "boundary_parent_index" ON "boundaries" USING btree ("parent_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_boundaries_name_normalized" ON "boundaries" USING btree (normalize_search_text((name)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "poi_boundaries_poi_id_boundary_id_key" ON "poi_boundaries" USING btree ("poi_id" text_ops,"boundary_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_poi_data_name_normalized" ON "poi_data" USING btree (normalize_search_text((name)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "poi_data_source_poi_id_language_key" ON "poi_data" USING btree ("source" enum_ops,"poi_id" text_ops,"language" enum_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "poi_data_source_source_id_language_key" ON "poi_data" USING btree ("source" enum_ops,"source_id" text_ops,"language" enum_ops);--> statement-breakpoint
CREATE INDEX "coords_index" ON "pois" USING gist ("coords" gist_geometry_ops_2d);--> statement-breakpoint
CREATE UNIQUE INDEX "pois_source_source_id_key" ON "pois" USING btree ("source" enum_ops,"source_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "visited_pois_user_id_poi_id_key" ON "visited_pois" USING btree ("user_id" text_ops,"poi_id" text_ops);