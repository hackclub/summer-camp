ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
-- Backfill: existing campers have already been using the app, so mark them
-- onboarded. New accounts insert with NULL and get sent through the flow.
UPDATE "users" SET "onboarded_at" = now() WHERE "onboarded_at" IS NULL;
