CREATE TABLE "user_feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(1000) NOT NULL,
	"category" varchar(100) NOT NULL,
	"message" varchar(10000) NOT NULL,
	"target_poi_id" varchar(1000),
	"location" geometry(point),
	"city" varchar(1000),
	"payload" jsonb NOT NULL,
	"app_version" varchar(100) NOT NULL,
	"os" varchar(100) NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_feedbacks" ADD CONSTRAINT "user_feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_feedbacks" ADD CONSTRAINT "user_feedbacks_target_poi_id_fkey" FOREIGN KEY ("target_poi_id") REFERENCES "public"."pois"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_user_feedbacks_user_id" ON "user_feedbacks" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_feedbacks_category" ON "user_feedbacks" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_feedbacks_target_poi_id" ON "user_feedbacks" USING btree ("target_poi_id" text_ops);
