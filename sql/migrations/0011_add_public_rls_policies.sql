-- Add public RLS policies for banners and products
-- Allow anonymous users to view active banners and all products

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "select-banner-public-policy" ON "banners";
DROP POLICY IF EXISTS "select-product-public-policy" ON "products";
DROP POLICY IF EXISTS "select-product-image-public-policy" ON "product_images";

-- Banner: Allow anonymous users to view active banners
CREATE POLICY "select-banner-public-policy"
ON "banners"
FOR SELECT
TO anon
USING (is_active = true);

-- Products: Allow anonymous users to view all products
CREATE POLICY "select-product-public-policy"
ON "products"
FOR SELECT
TO anon
USING (true);

-- Product Images: Allow anonymous users to view all product images
CREATE POLICY "select-product-image-public-policy"
ON "product_images"
FOR SELECT
TO anon
USING (true);

