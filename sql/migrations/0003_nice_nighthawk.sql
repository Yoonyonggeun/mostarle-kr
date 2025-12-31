DO $$ BEGIN
  CREATE POLICY "insert-product-detail-policy" ON "product_details" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "insert-product-image-policy" ON "product_images" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "insert-product-policy" ON "products" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.uid()) = "products"."created_by");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;