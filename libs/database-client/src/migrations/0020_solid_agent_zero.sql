ALTER TABLE "visited_pois" ADD COLUMN "location_id" integer;
--> statement-breakpoint

-- Data migration — for each visited_poi, create a user_location from coords and link it
DO $$
DECLARE
  vp RECORD;
  new_location_id INTEGER;
BEGIN
  FOR vp IN SELECT id, user_id, coords, created_at, updated_at FROM visited_pois LOOP
    INSERT INTO user_locations (user_id, coords, "timestamp", created_at, updated_at)
    VALUES (
      vp.user_id,
      -- Fallback to (0, 0) for the rare case where coords was NULL
      COALESCE(vp.coords, ST_SetSRID(ST_MakePoint(0, 0), 4326)),
      vp.created_at,
      vp.created_at,
      vp.updated_at
    )
    RETURNING id INTO new_location_id;

    UPDATE visited_pois SET location_id = new_location_id WHERE id = vp.id;
  END LOOP;
END;
$$;
--> statement-breakpoint

ALTER TABLE "visited_pois" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "visited_pois" ADD CONSTRAINT "visited_pois_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."user_locations"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint

ALTER TABLE "visited_pois" DROP COLUMN "coords";
