CREATE UNIQUE INDEX IF NOT EXISTS "users_hack_club_id_unique" ON "users" ("hack_club_id") WHERE "hack_club_id" IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"delivery_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);
