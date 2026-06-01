CREATE TYPE "public"."NotificationEventStatusEnum" AS ENUM('sent', 'opened', 'failed');--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"notification_id" varchar(50) NOT NULL,
	"user_id" varchar(1000) NOT NULL,
	"template_key" varchar(100) NOT NULL,
	"channel_id" varchar(50) NOT NULL,
	"priority" varchar(10) NOT NULL,
	"title_rendered" varchar(500) NOT NULL,
	"body_rendered" varchar(2000) NOT NULL,
	"variant_index" integer NOT NULL,
	"deep_link" varchar(500) NOT NULL,
	"status" "NotificationEventStatusEnum" NOT NULL,
	"failure_reason" varchar(500),
	"sent_at" timestamp (3) with time zone NOT NULL,
	"opened_at" timestamp (3) with time zone,
	"trigger_source" varchar(50) NOT NULL,
	"trigger_coords" geometry(point)
);
--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_events_notification_id_key" ON "notification_events" USING btree ("notification_id" text_ops);--> statement-breakpoint
CREATE INDEX "notification_events_user_id_sent_at_idx" ON "notification_events" USING btree ("user_id" text_ops,"sent_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notification_events_user_id_template_key_sent_at_idx" ON "notification_events" USING btree ("user_id" text_ops,"template_key" text_ops,"sent_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notification_events_trigger_coords_idx" ON "notification_events" USING gist ("trigger_coords" gist_geometry_ops_2d);--> statement-breakpoint
CREATE TRIGGER archive_notification_events
    BEFORE DELETE ON "notification_events"
    FOR EACH ROW EXECUTE FUNCTION public.archive_on_delete();
