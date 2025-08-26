-- CreateEnum
CREATE TYPE "public"."PoiFilterLevelEnum" AS ENUM ('UNKNOWN', 'STRICT', 'STANDARD', 'INTERMEDIATE', 'LAXIST');

-- AlterTable
ALTER TABLE "public"."pois" ADD COLUMN     "filter_level" "public"."PoiFilterLevelEnum" NOT NULL DEFAULT 'UNKNOWN';
