CREATE TABLE "poi_enriched" (
	"id" serial PRIMARY KEY NOT NULL,
	"poi_id" varchar(1000) NOT NULL,
	"name" varchar(1000),
	"description" varchar(10000),
	"source" varchar(100) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poi_fun_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"poi_enriched_id" integer NOT NULL,
	"content" varchar(10000) NOT NULL,
	"order" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "processing_results" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "poi_enriched" ADD CONSTRAINT "poi_enriched_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "poi_fun_facts" ADD CONSTRAINT "poi_fun_facts_poi_enriched_id_fkey" FOREIGN KEY ("poi_enriched_id") REFERENCES "public"."poi_enriched"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "poi_enriched_poi_id_key" ON "poi_enriched" USING btree ("poi_id" text_ops);