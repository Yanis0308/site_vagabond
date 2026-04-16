ALTER TABLE "visited_pois" ADD COLUMN "location_id" integer;
--> statement-breakpoint

-- Data migration (set-based): bulk-create user_locations from visited_pois and link them
-- Step 1: Add a temporary column to track the source visited_poi id
ALTER TABLE "user_locations" ADD COLUMN "_source_vp_id" integer;
--> statement-breakpoint

-- Step 2: Bulk insert all visited_pois coords into user_locations
INSERT INTO user_locations (user_id, coords, "timestamp", created_at, updated_at, "_source_vp_id")
SELECT user_id, COALESCE(coords, ST_SetSRID(ST_MakePoint(0, 0), 4326)), created_at, created_at, updated_at, id
FROM visited_pois;
--> statement-breakpoint

-- Step 3: Link visited_pois to their new user_locations via the temp column
UPDATE visited_pois vp SET location_id = ul.id FROM user_locations ul WHERE ul."_source_vp_id" = vp.id;
--> statement-breakpoint

-- Step 4: Drop the temporary column
ALTER TABLE "user_locations" DROP COLUMN "_source_vp_id";
--> statement-breakpoint

ALTER TABLE "visited_pois" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "visited_pois" ADD CONSTRAINT "visited_pois_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."user_locations"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "visited_pois" DROP COLUMN "coords";
