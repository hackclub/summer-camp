CREATE TABLE IF NOT EXISTS "extensions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"camp_day_id" text NOT NULL REFERENCES "camp_days"("id") ON DELETE CASCADE,
	"until" timestamptz NOT NULL,
	"created_by" text REFERENCES "users"("id"),
	"created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "extensions_user_day_idx" ON "extensions" ("user_id", "camp_day_id");
