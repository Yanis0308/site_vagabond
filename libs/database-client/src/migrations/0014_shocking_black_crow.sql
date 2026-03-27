CREATE TABLE "app_review" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(1000) NOT NULL,
	"positive" boolean NOT NULL,
	"comment" varchar(1000),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "app_review_user_id_key" ON "app_review" USING btree ("user_id");