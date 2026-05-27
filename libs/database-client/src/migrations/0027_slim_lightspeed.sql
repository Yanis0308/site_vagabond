CREATE TABLE "dashboard_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" integer NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "dashboard_organization_boundaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"organization_id" integer NOT NULL,
	"boundary_id" varchar(1000) NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "dashboard_organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(500) NOT NULL,
	"business_type" varchar(50) NOT NULL,
	"scope_mode" varchar(20) NOT NULL,
	"features" varchar(200)[] DEFAULT '{}' NOT NULL,
	"created_by" uuid,
	CONSTRAINT "dashboard_organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dashboard_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"email" varchar(1000) NOT NULL,
	"name" varchar(1000),
	"last_login" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_memberships" ADD CONSTRAINT "dashboard_memberships_user_id_dashboard_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dashboard_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_memberships" ADD CONSTRAINT "dashboard_memberships_organization_id_dashboard_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."dashboard_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_memberships" ADD CONSTRAINT "dashboard_memberships_created_by_dashboard_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."dashboard_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_organization_boundaries" ADD CONSTRAINT "dashboard_organization_boundaries_organization_id_dashboard_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."dashboard_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_organization_boundaries" ADD CONSTRAINT "dashboard_organization_boundaries_created_by_dashboard_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."dashboard_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_organizations" ADD CONSTRAINT "dashboard_organizations_created_by_dashboard_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."dashboard_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_memberships_user_org_key" ON "dashboard_memberships" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_org_boundaries_org_boundary_key" ON "dashboard_organization_boundaries" USING btree ("organization_id","boundary_id");--> statement-breakpoint
CREATE INDEX "dashboard_org_boundaries_boundary_id_idx" ON "dashboard_organization_boundaries" USING btree ("boundary_id");
