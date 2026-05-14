CREATE TABLE "push_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"user_id" varchar(1000) NOT NULL,
	"token" varchar(4000) NOT NULL,
	"platform" varchar(10) NOT NULL,
	"app_version" varchar(50) NOT NULL,
	"os_version" varchar(50) NOT NULL,
	"device_model" varchar(100),
	"last_seen_at" timestamp (3) NOT NULL,
	"disabled_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "push_devices_token_key" ON "push_devices" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "push_devices_user_id_idx" ON "push_devices" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "push_devices_disabled_at_idx" ON "push_devices" USING btree ("disabled_at" timestamp_ops);