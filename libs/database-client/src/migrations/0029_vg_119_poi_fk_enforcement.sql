-- VG-119 — Toutes les FK vers `pois` passent en ON DELETE NO ACTION : la base
-- refuse de supprimer un POI référencé (cf. ADR 0011, disable-not-delete).
ALTER TABLE "poi_boundaries" DROP CONSTRAINT "poi_boundaries_poi_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_feedbacks" DROP CONSTRAINT "user_feedbacks_target_poi_id_fkey";
--> statement-breakpoint
ALTER TABLE "poi_boundaries" ADD CONSTRAINT "poi_boundaries_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "poi_data" ADD CONSTRAINT "poi_data_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_feedbacks" ADD CONSTRAINT "user_feedbacks_target_poi_id_fkey" FOREIGN KEY ("target_poi_id") REFERENCES "public"."pois"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "visited_pois" ADD CONSTRAINT "visited_pois_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "public"."pois"("id") ON DELETE no action ON UPDATE cascade;
