# 마이그레이션 수동 적용 가이드

## 문제
`drizzle-kit migrate`가 이전 마이그레이션과 충돌하여 새로운 마이그레이션(0002)이 적용되지 않았습니다.

## 해결 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. Supabase 대시보드 접속
2. SQL Editor로 이동
3. 아래 SQL을 복사하여 실행:

```sql
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
ALTER TABLE "product_details" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "product_images" (
	"image_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_images_image_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" bigint NOT NULL,
	"image_url" text NOT NULL,
	"image_order" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;

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
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "product_details" ADD CONSTRAINT "product_details_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE POLICY "select-product-detail-policy" ON "product_details" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
CREATE POLICY "update-product-detail-policy" ON "product_details" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
CREATE POLICY "delete-product-detail-policy" ON "product_details" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_details"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
CREATE POLICY "select-product-image-policy" ON "product_images" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
CREATE POLICY "update-product-image-policy" ON "product_images" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      )) WITH CHECK (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
CREATE POLICY "delete-product-image-policy" ON "product_images" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (
        SELECT 1 FROM "products"
        WHERE "products"."product_id" = "product_images"."product_id"
        AND "products"."created_by" = (select auth.uid())
      ));
CREATE POLICY "select-product-policy" ON "products" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.uid()) = "products"."created_by");
CREATE POLICY "update-product-policy" ON "products" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.uid()) = "products"."created_by") WITH CHECK ((select auth.uid()) = "products"."created_by");
CREATE POLICY "delete-product-policy" ON "products" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.uid()) = "products"."created_by");
```

4. 마이그레이션 추적 테이블에 기록 추가:

```sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) 
VALUES ('0002_gorgeous_wrecker', NOW())
ON CONFLICT DO NOTHING;
```

### 방법 2: drizzle-kit push 사용 (대안)

```bash
npm run drizzle-kit push
```

주의: 이 방법은 스키마를 직접 동기화하므로 마이그레이션 히스토리가 제대로 추적되지 않을 수 있습니다.

