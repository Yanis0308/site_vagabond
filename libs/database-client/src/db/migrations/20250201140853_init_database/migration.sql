-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "PoiSourceEnum" AS ENUM ('OSM');

-- CreateEnum
CREATE TYPE "PoiDataSourceEnum" AS ENUM ('OSM', 'AI', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LanguageEnum" AS ENUM ('EN', 'FR');

-- CreateEnum
CREATE TYPE "VisitedPoiStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateTable
CREATE TABLE "users" (
    "user_id" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(1000),
    "full_name" VARCHAR(1000),
    "oauth_providers" VARCHAR(1000)[],
    "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "pois" (
    "id" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "PoiSourceEnum" NOT NULL,
    "source_id" VARCHAR(1000) NOT NULL,
    "coords" geometry(Point, 4326) NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "disabled_reason" VARCHAR(1000),

    CONSTRAINT "pois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poi_data" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(1000) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "raw_info" JSONB NOT NULL,
    "source" "PoiDataSourceEnum" NOT NULL,
    "source_id" VARCHAR(1000) NOT NULL,
    "language" "LanguageEnum" NOT NULL,
    "poi_id" VARCHAR(1000) NOT NULL,

    CONSTRAINT "poi_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visited_pois" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VisitedPoiStatus" NOT NULL DEFAULT 'PENDING',
    "coords" geometry(Point, 4326) NOT NULL,
    "poi_id" VARCHAR(1000) NOT NULL,
    "user_id" VARCHAR(1000) NOT NULL,

    CONSTRAINT "visited_pois_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coords_index" ON "pois" USING GIST ("coords");

-- CreateIndex
CREATE UNIQUE INDEX "pois_source_source_id_key" ON "pois"("source", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "poi_data_source_source_id_language_key" ON "poi_data"("source", "source_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "poi_data_source_poi_id_language_key" ON "poi_data"("source", "poi_id", "language");

-- CreateIndex
CREATE UNIQUE INDEX "visited_pois_user_id_poi_id_key" ON "visited_pois"("user_id", "poi_id");

-- AddForeignKey
ALTER TABLE "poi_data" ADD CONSTRAINT "poi_data_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visited_pois" ADD CONSTRAINT "visited_pois_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visited_pois" ADD CONSTRAINT "visited_pois_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
