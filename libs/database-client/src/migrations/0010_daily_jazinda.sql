ALTER TABLE "processing_results" ALTER COLUMN "type" SET DATA TYPE varchar(100);--> statement-breakpoint
DROP TYPE "public"."ProcessingTypeEnum";
