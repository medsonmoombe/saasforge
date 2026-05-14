CREATE TYPE "public"."notification_type" AS ENUM('task_assigned', 'status_changed', 'overdue_warning', 'project_shared');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"recipient_id" varchar(50) NOT NULL,
	"actor_id" varchar(50),
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"entity_id" varchar(100),
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_recipient_idx" ON "notifications" USING btree ("recipient_id");