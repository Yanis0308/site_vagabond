DROP TABLE "poi_fun_facts" CASCADE;--> statement-breakpoint
ALTER TABLE "poi_enriched" ADD COLUMN "enriched_data" jsonb;--> statement-breakpoint
ALTER TABLE "poi_enriched" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "poi_enriched" DROP COLUMN "description";