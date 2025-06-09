/*
  Warnings:

  - You are about to drop the column `status` on the `visited_pois` table. All the data in the column will be lost.
  - Added the required column `comment` to the `visited_pois` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_key` to the `visited_pois` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rating` to the `visited_pois` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "visited_pois" DROP COLUMN "status",
ADD COLUMN     "comment" VARCHAR(10000) NOT NULL,
ADD COLUMN     "image_key" VARCHAR(1000) NOT NULL,
ADD COLUMN     "rating" INTEGER NOT NULL;
