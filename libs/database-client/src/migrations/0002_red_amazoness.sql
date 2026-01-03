CREATE TYPE "public"."ProcessingStatusEnum" AS ENUM('pending', 'success', 'error');--> statement-breakpoint
CREATE TYPE "public"."ProcessingTypeEnum" AS ENUM('scraper-maps', 'scraper-web', 'llm');--> statement-breakpoint
CREATE TABLE "processing_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_id" varchar(1000) NOT NULL,
	"status" "ProcessingStatusEnum" NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"batch_id" varchar(1000),
	"type" "ProcessingTypeEnum" NOT NULL
);
