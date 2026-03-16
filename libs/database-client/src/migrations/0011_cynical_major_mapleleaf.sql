CREATE TYPE "public"."ImageSourceEnum" AS ENUM('CAMERA', 'GALLERY');--> statement-breakpoint
ALTER TABLE "visited_pois" ADD COLUMN "image_source" "ImageSourceEnum" NOT NULL DEFAULT 'CAMERA';--> statement-breakpoint
