CREATE TABLE "product_details" (
	"detail_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_details_detail_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" bigint NOT NULL,
	"detail_title" text NOT NULL,
	"detail_description" text NOT NULL,
	"detail_image_url" text,
	"detail_order" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_images" (
	"image_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_images_image_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" bigint NOT NULL,
	"image_url" text NOT NULL,
	"image_order" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"product_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_product_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"price" double precision NOT NULL,
	"difficulty" integer,
	"working_time" integer NOT NULL,
	"width" double precision,
	"height" double precision,
	"depth" double precision,
	"slug" text NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_details" ADD CONSTRAINT "product_details_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "select-product-detail-policy" ON "product_details" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "update-product-detail-policy" ON "product_details" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "delete-product-detail-policy" ON "product_details" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "select-product-image-policy" ON "product_images" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "update-product-image-policy" ON "product_images" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "delete-product-image-policy" ON "product_images" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));--> statement-breakpoint
CREATE POLICY "select-product-policy" ON "products" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "products"."created_by");--> statement-breakpoint
CREATE POLICY "update-product-policy" ON "products" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "products"."created_by") WITH CHECK ((select auth.uid()) = "products"."created_by");--> statement-breakpoint
CREATE POLICY "delete-product-policy" ON "products" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "products"."created_by");