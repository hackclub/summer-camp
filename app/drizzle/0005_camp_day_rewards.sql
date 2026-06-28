ALTER TABLE "camp_days" ADD COLUMN "hours" numeric(4, 2) DEFAULT '3' NOT NULL;--> statement-breakpoint
ALTER TABLE "camp_days" ADD COLUMN "reward_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "camp_days" ADD COLUMN "prize_label" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ship_address" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "logged_hours" numeric(4, 2);
