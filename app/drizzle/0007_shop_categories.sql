CREATE TABLE "shop_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "shop_items" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "shop_items" ADD CONSTRAINT "shop_items_category_id_shop_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."shop_categories"("id") ON DELETE set null ON UPDATE no action;
