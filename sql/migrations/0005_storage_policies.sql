-- Storage bucket RLS policies for products bucket
-- This allows authenticated users to upload, read, update, and delete files in the products bucket
--
-- IMPORTANT: 먼저 Supabase 대시보드 > Storage에서 'products' 버킷을 생성해야 합니다.
-- 1. Storage 메뉴로 이동
-- 2. "Create a new bucket" 클릭
-- 3. Bucket name: products
-- 4. Public bucket: 체크 (또는 원하는 설정)
-- 5. File size limit: 5MB (5242880 bytes)
-- 6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 7. Create 버튼 클릭
--
-- 그 다음 아래 SQL 정책들을 실행하세요.

-- Policy for INSERT (upload): Allow authenticated users to upload files to products bucket
DO $$ BEGIN
  CREATE POLICY "Allow authenticated users to upload to products bucket"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Policy for SELECT (read): Allow authenticated users to read files from products bucket
DO $$ BEGIN
  CREATE POLICY "Allow authenticated users to read from products bucket"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'products'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Policy for UPDATE: Allow authenticated users to update files in products bucket
DO $$ BEGIN
  CREATE POLICY "Allow authenticated users to update files in products bucket"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products'
  )
  WITH CHECK (
    bucket_id = 'products'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Policy for DELETE: Allow authenticated users to delete files from products bucket
DO $$ BEGIN
  CREATE POLICY "Allow authenticated users to delete from products bucket"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

