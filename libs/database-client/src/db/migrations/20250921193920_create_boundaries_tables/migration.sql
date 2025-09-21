-- CreateEnum
CREATE TYPE "BoundaryLevelEnum" AS ENUM ('COUNTRY', 'REGION', 'COUNTY', 'CITY', 'DISTRICT', 'NEIGHBORHOOD');

-- CreateTable
CREATE TABLE "boundaries" (
    "id" VARCHAR(1000) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(1000),
    "boundary_level" "BoundaryLevelEnum" NOT NULL,
    "geom" geometry(MultiPolygon, 4326) NOT NULL,
    "raw_info" JSONB NOT NULL,
    "parent_id" VARCHAR(1000),
    "display_point" geometry(Point, 4326) NOT NULL,
    "place_type" VARCHAR(100) NOT NULL,
    "population" INTEGER NOT NULL,
    "is_capital" BOOLEAN NOT NULL,
    "importance_score" DOUBLE PRECISION NOT NULL,
    "way_area" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "boundaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poi_boundaries" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poi_id" VARCHAR(1000) NOT NULL,
    "boundary_id" VARCHAR(1000) NOT NULL,

    CONSTRAINT "poi_boundaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boundary_geom_index" ON "boundaries" USING GIST ("geom");

-- CreateIndex
CREATE INDEX "boundary_level_index" ON "boundaries"("boundary_level");

-- CreateIndex
CREATE INDEX "boundary_parent_index" ON "boundaries"("parent_id");

-- CreateIndex
CREATE INDEX "boundary_display_point_index" ON "boundaries" USING GIST ("display_point");

-- CreateIndex
CREATE INDEX "boundary_importance_index" ON "boundaries"("importance_score");

-- CreateIndex
CREATE UNIQUE INDEX "poi_boundaries_poi_id_boundary_id_key" ON "poi_boundaries"("poi_id", "boundary_id");

-- AddForeignKey
ALTER TABLE "boundaries" ADD CONSTRAINT "boundaries_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "boundaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_boundaries" ADD CONSTRAINT "poi_boundaries_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_boundaries" ADD CONSTRAINT "poi_boundaries_boundary_id_fkey" FOREIGN KEY ("boundary_id") REFERENCES "boundaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
