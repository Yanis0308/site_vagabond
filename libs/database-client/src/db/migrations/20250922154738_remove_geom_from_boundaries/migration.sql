/*
  Warnings:

  - You are about to drop the column `geom` on the `boundaries` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "boundary_geom_index";

-- AlterTable
ALTER TABLE "boundaries" DROP COLUMN "geom";
