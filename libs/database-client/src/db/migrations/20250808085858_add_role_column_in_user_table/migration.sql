-- CreateEnum
CREATE TYPE "public"."RoleEnum" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "role" "public"."RoleEnum" NOT NULL DEFAULT 'USER';
