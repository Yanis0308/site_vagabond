ALTER TABLE "poi_enriched" DROP CONSTRAINT "poi_enriched_poi_id_fkey";
--> statement-breakpoint
ALTER TABLE "processing_results" ADD COLUMN "distance" integer;--> statement-breakpoint
ALTER TABLE "processing_results" ADD COLUMN "is_valid" boolean;--> statement-breakpoint
ALTER TABLE "poi_enriched" ADD CONSTRAINT "poi_enriched_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE no action ON UPDATE cascade;