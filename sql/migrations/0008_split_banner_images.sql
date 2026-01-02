-- Split banner image_url into image_url_mobile and image_url_desktop
-- Rename existing image_url to image_url_mobile
ALTER TABLE "banners" RENAME COLUMN "image_url" TO "image_url_mobile";

-- Add new image_url_desktop column (temporary with default, will be updated)
ALTER TABLE "banners" ADD COLUMN "image_url_desktop" text;

-- Copy mobile image to desktop for existing records
UPDATE "banners" SET "image_url_desktop" = "image_url_mobile";

-- Make image_url_desktop NOT NULL after copying data
ALTER TABLE "banners" ALTER COLUMN "image_url_desktop" SET NOT NULL;

