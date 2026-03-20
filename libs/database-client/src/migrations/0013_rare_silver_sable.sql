CREATE TABLE "user_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"user_id" varchar(1000) NOT NULL,
	"coords" geometry(point) NOT NULL,
	"accuracy" double precision,
	"altitude" double precision,
	"altitude_accuracy" double precision,
	"heading" double precision,
	"speed" double precision,
	"timestamp" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "user_locations_user_id_timestamp_idx" ON "user_locations" USING btree ("user_id" text_ops,"timestamp" timestamp_ops);--> statement-breakpoint
CREATE INDEX "user_locations_coords_idx" ON "user_locations" USING gist ("coords" gist_geometry_ops_2d);--> statement-breakpoint
CREATE INDEX "user_locations_timestamp_idx" ON "user_locations" USING btree ("timestamp" timestamp_ops);
