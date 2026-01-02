/**
 * Create Product API Endpoint
 *
 * This file implements an API endpoint for creating new products.
 * It handles form data processing, validation, multiple image uploads, and database updates.
 *
 * Key features:
 * - Form data validation with Zod schema
 * - Multiple file upload handling for product images and detail images
 * - Storage management with Supabase Storage
 * - Product data creation with related images and details
 * - Comprehensive error handling
 * - Admin email authorization
 */
import type { Route } from "./+types/create";

import { eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import db from "~/core/db/drizzle-client.server";
import { requireAdminEmail, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { productDetails, productImages, products } from "../schema";

/**
 * Generate a URL-safe slug from a title
 *
 * @param title - The title to convert to a slug
 * @returns A URL-safe slug string
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validation schema for product creation form data
 *
 * This schema defines the required fields and validation rules:
 * - title: Required, must be at least 1 character
 * - price: Required, must be a positive number
 * - difficulty: Optional, must be between 1 and 5
 * - working_time: Required, must be a positive integer
 * - width, height, depth: Optional dimensions
 * - slug: Optional, will be auto-generated if not provided
 * - details: Array of detail objects with title, description, and optional image
 * - images: Array of image files (minimum 1 required)
 */
const productSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다"),
  price: z.coerce.number().positive("가격은 양수여야 합니다"),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  working_time: z.coerce.number().int().positive("작업시간은 양수여야 합니다"),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  depth: z.coerce.number().optional(),
  slug: z.string().optional(),
  details: z
    .array(
      z.object({
        title: z.string().min(1, "상세 제목은 필수입니다"),
        description: z.string().min(1, "상세 설명은 필수입니다"),
        image: z.instanceof(File).optional(),
      }),
    )
    .optional()
    .default([]),
  images: z.array(z.instanceof(File)).min(1, "최소 1장의 이미지가 필요합니다"),
});

/**
 * Action handler for processing product creation requests
 *
 * This function handles the complete product creation flow:
 * 1. Validates the request method and admin email authorization
 * 2. Processes and validates form data using the Zod schema
 * 3. Handles multiple image uploads to Supabase Storage
 * 4. Creates product record with related images and details
 * 5. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Validates admin email authorization before processing
 * - Validates file size and type for image uploads
 * - Uses user ID from authenticated session for database operations
 * - Handles errors gracefully with appropriate status codes
 * - Cleans up uploaded files on failure
 *
 * @param request - The incoming HTTP request with form data
 * @returns Response indicating success or error with appropriate details
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow POST)
  requireMethod("POST")(request);

  // Create a server-side Supabase client with the user's session
  const [client, headers] = makeServerClient(request);

  // Verify admin email authorization
  const user = await requireAdminEmail(client);

  // Extract form data
  const formData = await request.formData();

  // Parse arrays from FormData
  // FormData에서 배열 필드 처리
  const images: File[] = [];
  const details: Array<{
    title: string;
    description: string;
    image?: File;
  }> = [];

  // Extract images
  const imageFiles = formData.getAll("images");
  for (const file of imageFiles) {
    if (file instanceof File && file.size > 0) {
      images.push(file);
    }
  }

  // Extract details
  // Find all detail indices
  const detailIndices = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^details\[(\d+)\]\.title$/);
    if (match) {
      detailIndices.add(parseInt(match[1], 10));
    }
  }

  // Sort indices to maintain order
  const sortedIndices = Array.from(detailIndices).sort((a, b) => a - b);

  for (const index of sortedIndices) {
    const title = formData.get(`details[${index}].title`) as string;
    const description = formData.get(`details[${index}].description`) as string;
    const image = formData.get(`details[${index}].image`);

    if (title && description) {
      details.push({
        title,
        description,
        image: image instanceof File && image.size > 0 ? image : undefined,
      });
    }
  }

  // Prepare data for validation
  const dataToValidate = {
    title: formData.get("title"),
    price: formData.get("price"),
    difficulty: formData.get("difficulty"),
    working_time: formData.get("working_time"),
    width: formData.get("width"),
    height: formData.get("height"),
    depth: formData.get("depth"),
    slug: formData.get("slug"),
    details,
    images,
  };

  // Validate form data
  const {
    success,
    data: validData,
    error,
  } = productSchema.safeParse(dataToValidate);

  // Return validation errors if any
  if (!success) {
    return data(
      { fieldErrors: error.flatten().fieldErrors },
      { status: 400, headers },
    );
  }

  // Generate slug if not provided
  const slug = validData.slug || generateSlug(validData.title);

  // Check if slug already exists
  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (existingProduct.length > 0) {
    return data(
      { error: "이미 사용 중인 slug입니다" },
      { status: 400, headers },
    );
  }

  // Validate image files
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  for (const image of validData.images) {
    if (image.size > maxFileSize) {
      return data(
        { error: `이미지 파일 크기는 5MB를 초과할 수 없습니다: ${image.name}` },
        { status: 400, headers },
      );
    }
    if (!image.type.startsWith("image/")) {
      return data(
        { error: `이미지 파일만 업로드 가능합니다: ${image.name}` },
        { status: 400, headers },
      );
    }
  }

  // Validate detail images
  for (const detail of validData.details) {
    if (detail.image) {
      if (detail.image.size > maxFileSize) {
        return data(
          {
            error: `상세 이미지 파일 크기는 5MB를 초과할 수 없습니다: ${detail.image.name}`,
          },
          { status: 400, headers },
        );
      }
      if (!detail.image.type.startsWith("image/")) {
        return data(
          { error: `이미지 파일만 업로드 가능합니다: ${detail.image.name}` },
          { status: 400, headers },
        );
      }
    }
  }

  // Create product record using Supabase client (to respect RLS)
  console.log("Creating product with data:", {
    title: validData.title,
    price: validData.price,
    slug,
    created_by: user.id,
    images_count: validData.images.length,
    details_count: validData.details.length,
  });

  const { data: newProduct, error: productInsertError } = await client
    .from("products")
    .insert({
      title: validData.title,
      price: validData.price,
      difficulty: validData.difficulty ?? null,
      working_time: validData.working_time,
      width: validData.width ?? null,
      height: validData.height ?? null,
      depth: validData.depth ?? null,
      slug,
      created_by: user.id,
    })
    .select()
    .single();

  if (productInsertError || !newProduct) {
    console.error("Product insert error:", productInsertError);
    console.error("Product insert error details:", {
      code: productInsertError?.code,
      message: productInsertError?.message,
      details: productInsertError?.details,
      hint: productInsertError?.hint,
    });
    return data(
      {
        error: productInsertError
          ? `상품 생성 실패: ${productInsertError.message}`
          : "상품 생성 실패: 응답 데이터가 없습니다",
      },
      { status: 400, headers },
    );
  }

  console.log("Product created successfully:", newProduct);
  const productId = newProduct.product_id;

  if (!productId || typeof productId !== "number") {
    console.error("Invalid product ID:", productId);
    return data(
      { error: "상품 ID가 올바르게 생성되지 않았습니다" },
      { status: 500, headers },
    );
  }

  // Track uploaded files for cleanup on error
  const uploadedFiles: string[] = [];

  try {
    // Upload product images
    const imageUrls: Array<{ url: string; order: number }> = [];
    console.log(`Starting upload of ${validData.images.length} product images`);

    for (let i = 0; i < validData.images.length; i++) {
      const image = validData.images[i];
      const timestamp = Date.now();
      const fileName = `${timestamp}-${image.name}`;
      const filePath = `products/${productId}/${fileName}`;

      console.log(`Uploading image ${i + 1}/${validData.images.length}:`, {
        fileName,
        filePath,
        size: image.size,
        type: image.type,
      });

      const { data: uploadData, error: uploadError } = await client.storage
        .from("products")
        .upload(filePath, image, {
          upsert: false,
        });

      if (uploadError) {
        console.error(`Image upload error for ${fileName}:`, uploadError);
        console.error("Upload error details:", {
          message: uploadError.message,
        });
        // Clean up uploaded files
        if (uploadedFiles.length > 0) {
          await client.storage.from("products").remove(uploadedFiles);
        }
        return data(
          {
            error: `이미지 업로드 실패: ${uploadError.message} (파일: ${image.name})`,
          },
          { status: 400, headers },
        );
      }

      console.log(`Image uploaded successfully:`, uploadData);
      uploadedFiles.push(filePath);

      const {
        data: { publicUrl },
      } = await client.storage.from("products").getPublicUrl(filePath);

      console.log(`Public URL for image ${i + 1}:`, publicUrl);
      imageUrls.push({ url: publicUrl, order: i });
    }

    // Insert product images using Supabase client (to respect RLS)
    if (imageUrls.length > 0) {
      const imageRecords = imageUrls.map(({ url, order }) => ({
        product_id: productId,
        image_url: url,
        image_order: order,
      }));

      console.log("Inserting product images:", {
        productId,
        count: imageRecords.length,
        records: imageRecords,
      });

      const { data: insertedImages, error: insertError } = await client
        .from("product_images")
        .insert(imageRecords)
        .select();

      if (insertError) {
        console.error("Product images insert error:", insertError);
        // Clean up uploaded files
        if (uploadedFiles.length > 0) {
          await client.storage.from("products").remove(uploadedFiles);
        }
        // Clean up product record using Supabase client
        try {
          await client.from("products").delete().eq("product_id", productId);
        } catch (deleteError) {
          console.error("Failed to delete product record:", deleteError);
        }
        return data(
          { error: `이미지 저장 실패: ${insertError.message}` },
          { status: 400, headers },
        );
      }

      console.log("Product images inserted successfully:", insertedImages);
    }

    // Upload detail images and create detail records
    if (validData.details.length > 0) {
      const detailRecords: Array<{
        product_id: number;
        detail_title: string;
        detail_description: string;
        detail_image_url: string | null;
        detail_order: number;
      }> = [];

      for (let i = 0; i < validData.details.length; i++) {
        const detail = validData.details[i];
        let detailImageUrl: string | null = null;

        if (detail.image) {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${detail.image.name}`;
          const filePath = `products/${productId}/details/${i}/${fileName}`;

          console.log(`Uploading detail image ${i + 1}:`, {
            fileName,
            filePath,
            size: detail.image.size,
            type: detail.image.type,
          });

          const { data: uploadData, error: uploadError } = await client.storage
            .from("products")
            .upload(filePath, detail.image, {
              upsert: false,
            });

          if (uploadError) {
            console.error(
              `Detail image upload error for ${fileName}:`,
              uploadError,
            );
            console.error("Upload error details:", {
              message: uploadError.message,
            });
            // Clean up uploaded files
            if (uploadedFiles.length > 0) {
              await client.storage.from("products").remove(uploadedFiles);
            }
            return data(
              {
                error: `상세 이미지 업로드 실패: ${uploadError.message} (파일: ${detail.image.name})`,
              },
              { status: 400, headers },
            );
          }

          console.log(`Detail image uploaded successfully:`, uploadData);
          uploadedFiles.push(filePath);

          const {
            data: { publicUrl },
          } = await client.storage.from("products").getPublicUrl(filePath);

          console.log(`Public URL for detail image ${i + 1}:`, publicUrl);
          detailImageUrl = publicUrl;
        }

        detailRecords.push({
          product_id: productId,
          detail_title: detail.title,
          detail_description: detail.description,
          detail_image_url: detailImageUrl,
          detail_order: i,
        });
      }

      // Insert product details using Supabase client (to respect RLS)
      console.log("Inserting product details:", {
        productId,
        count: detailRecords.length,
        records: detailRecords,
      });

      const { data: insertedDetails, error: detailInsertError } = await client
        .from("product_details")
        .insert(detailRecords)
        .select();

      if (detailInsertError) {
        console.error("Product details insert error:", detailInsertError);
        // Clean up uploaded files
        if (uploadedFiles.length > 0) {
          await client.storage.from("products").remove(uploadedFiles);
        }
        // Clean up product record using Supabase client
        try {
          await client.from("products").delete().eq("product_id", productId);
        } catch (deleteError) {
          console.error("Failed to delete product record:", deleteError);
        }
        return data(
          { error: `상세 정보 저장 실패: ${detailInsertError.message}` },
          { status: 400, headers },
        );
      }

      console.log("Product details inserted successfully:", insertedDetails);
    }

    // Return success response
    return data(
      {
        success: true,
        productId,
        slug,
      },
      { headers },
    );
  } catch (error) {
    console.error("Unexpected error during product creation:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    // Clean up uploaded files on error
    if (uploadedFiles.length > 0) {
      try {
        console.log(`Cleaning up ${uploadedFiles.length} uploaded files`);
        await client.storage.from("products").remove(uploadedFiles);
      } catch (cleanupError) {
        // Log cleanup error but don't fail the request
        console.error("Failed to cleanup uploaded files:", cleanupError);
      }
    }

    // Clean up product record
    if (productId) {
      try {
        console.log(`Cleaning up product record with ID: ${productId}`);
        await client.from("products").delete().eq("product_id", productId);
      } catch (deleteError) {
        console.error("Failed to delete product record:", deleteError);
      }
    }

    return data(
      {
        error:
          error instanceof Error
            ? `상품 생성 중 오류가 발생했습니다: ${error.message}`
            : "상품 생성 중 알 수 없는 오류가 발생했습니다",
      },
      { status: 500, headers },
    );
  }
}
