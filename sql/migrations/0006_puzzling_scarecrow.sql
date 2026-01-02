ALTER POLICY "insert-banner-policy" ON "banners" TO authenticated WITH CHECK ((select auth.uid()) = "banners"."created_by");--> statement-breakpoint
ALTER POLICY "select-banner-policy" ON "banners" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "update-banner-policy" ON "banners" TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
ALTER POLICY "delete-banner-policy" ON "banners" TO authenticated USING (true);