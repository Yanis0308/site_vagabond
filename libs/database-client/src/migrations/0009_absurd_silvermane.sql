ALTER TABLE "poi_data" ADD COLUMN "main_category" varchar(100);--> statement-breakpoint
ALTER TABLE "poi_data" ADD COLUMN "categories" jsonb;