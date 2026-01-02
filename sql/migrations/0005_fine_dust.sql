CREATE TABLE "banners" (
	"banner_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "banners_banner_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"link_url" text,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "banners" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "insert-banner-policy" ON "banners" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1 FROM "auth"."users"
        WHERE "auth"."users"."id" = (select auth.uid())
        AND "auth"."users"."email" = 'yoon5ye@gmail.com'
      ) AND (select auth.uid()) = "banners"."created_by");--> statement-breakpoint
CREATE POLICY "select-banner-policy" ON "banners" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "auth"."users"
        WHERE "auth"."users"."id" = (select auth.uid())
        AND "auth"."users"."email" = 'yoon5ye@gmail.com'
      ));--> statement-breakpoint
CREATE POLICY "update-banner-policy" ON "banners" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "auth"."users"
        WHERE "auth"."users"."id" = (select auth.uid())
        AND "auth"."users"."email" = 'yoon5ye@gmail.com'
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM "auth"."users"
        WHERE "auth"."users"."id" = (select auth.uid())
        AND "auth"."users"."email" = 'yoon5ye@gmail.com'
      ));--> statement-breakpoint
CREATE POLICY "delete-banner-policy" ON "banners" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "auth"."users"
        WHERE "auth"."users"."id" = (select auth.uid())
        AND "auth"."users"."email" = 'yoon5ye@gmail.com'
      ));