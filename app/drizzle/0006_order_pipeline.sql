UPDATE "shop_orders" SET "status" = 'ordered' WHERE "status" = 'pending';--> statement-breakpoint
UPDATE "shop_orders" SET "status" = 'delivered' WHERE "status" = 'fulfilled';--> statement-breakpoint
UPDATE "shop_orders" SET "status" = 'refunded' WHERE "status" = 'rejected';--> statement-breakpoint
ALTER TABLE "shop_orders" ALTER COLUMN "status" SET DEFAULT 'ordered';--> statement-breakpoint
ALTER TABLE "shop_orders" ALTER COLUMN "item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "prize_label" text;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "source_project_id" text;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "tracking_url" text;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_source_project_id_projects_id_fk" FOREIGN KEY ("source_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "shop_orders_source_project_idx" ON "shop_orders" USING btree ("source_project_id") WHERE "source_project_id" IS NOT NULL;
