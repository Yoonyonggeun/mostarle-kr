/**
 * Update Product API Endpoint
 *
 * This file implements an API endpoint for updating existing products.
 * It handles form data processing, validation, image management, and database updates.
 *
 * Key features:
 * - Form data validation with Zod schema
 * - Multiple file upload handling for product images and detail images
 * - Storage management with Supabase Storage
 * - Product data update with related images and details
 * - Comprehensive error handling
 * - Admin email authorization
 */
import type { Route } from "./+types/update";

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
 * Extract file path from Supabase Storage URL
 *
 * @param url - The full Supabase Storage URL
 * @returns The file path relative to the bucket
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/public\/products\/(.+)/,
    );
    if (pathMatch) {
      return pathMatch[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validation schema for product update form data
 *
 * This schema is similar to the creation schema but allows optional images
 * if existing images are being kept.
 */
const productUpdateSchema = z.object({
  product_id: z.coerce.number().int().positive("상품 ID는 양수여야 합니다"),
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
        detail_id: z.coerce.number().optional(), // 기존 detail의 ID (edit 모드에서)
      }),
    )
    .optional()
    .default([]),
  images: z.array(z.instanceof(File)).optional().default([]),
  // IDs of existing images to keep (optional)
  existing_image_ids: z.array(z.coerce.number()).optional().default([]),
  // IDs of existing details to keep (optional)
  existing_detail_ids: z.array(z.coerce.number()).optional().default([]),
});

/**
 * Loader function for fetching existing product data
 *
 * @param request - The incoming HTTP request
 * @returns Product data with images and details
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client, headers] = makeServerClient(request);

  // Verify admin email authorization
  await requireAdminEmail(client);

  // Get product ID from URL
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");

  if (!productId) {
    throw data({ error: "상품 ID가 필요합니다" }, { status: 400, headers });
  }

  const productIdNum = parseInt(productId, 10);
  if (isNaN(productIdNum)) {
    throw data(
      { error: "유효하지 않은 상품 ID입니다" },
      { status: 400, headers },
    );
  }

  // Get product
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.product_id, productIdNum))
    .limit(1);

  if (!product) {
    throw data({ error: "상품을 찾을 수 없습니다" }, { status: 404, headers });
  }

  // Get product images
  const productImagesList = await db
    .select()
    .from(productImages)
    .where(eq(productImages.product_id, productIdNum))
    .orderBy(productImages.image_order);

  // Get product details
  const productDetailsList = await db
    .select()
    .from(productDetails)
    .where(eq(productDetails.product_id, productIdNum))
    .orderBy(productDetails.detail_order);

  return {
    product,
    images: productImagesList,
    details: productDetailsList,
  };
}

/**
 * Action handler for processing product update requests
 *
 * This function handles the complete product update flow:
 * 1. Validates the request method and admin email authorization
 * 2. Processes and validates form data using the Zod schema
 * 3. Verifies product ownership
 * 4. Handles image updates (delete old, upload new)
 * 5. Updates product record with related images and details
 * 6. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Validates admin email authorization before processing
 * - Verifies product ownership before updating
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
  const images: File[] = [];
  const details: Array<{
    title: string;
    description: string;
    image?: File;
    detail_id?: number;
  }> = [];
  const existingImageIds: number[] = [];
  const existingDetailIds: number[] = [];

  // Extract images
  const imageFiles = formData.getAll("images");
  for (const file of imageFiles) {
    if (file instanceof File && file.size > 0) {
      images.push(file);
    }
  }

  // Extract existing image IDs
  const existingImageIdsStr = formData.getAll("existing_image_ids");
  for (const idStr of existingImageIdsStr) {
    const id = parseInt(idStr as string, 10);
    if (!isNaN(id)) {
      existingImageIds.push(id);
    }
  }

  // Extract existing detail IDs
  const existingDetailIdsStr = formData.getAll("existing_detail_ids");
  for (const idStr of existingDetailIdsStr) {
    const id = parseInt(idStr as string, 10);
    if (!isNaN(id)) {
      existingDetailIds.push(id);
    }
  }

  // Extract details
  const detailIndices = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^details\[(\d+)\]\.title$/);
    if (match) {
      detailIndices.add(parseInt(match[1], 10));
    }
  }

  const sortedIndices = Array.from(detailIndices).sort((a, b) => a - b);

  for (const index of sortedIndices) {
    const title = formData.get(`details[${index}].title`) as string;
    const description = formData.get(`details[${index}].description`) as string;
    const image = formData.get(`details[${index}].image`);
    const detailIdStr = formData.get(`details[${index}].detail_id`) as string;
    const detailId = detailIdStr ? parseInt(detailIdStr, 10) : undefined;

    if (title && description) {
      details.push({
        title,
        description,
        image: image instanceof File && image.size > 0 ? image : undefined,
        detail_id: detailId && !isNaN(detailId) ? detailId : undefined,
      });
    }
  }

  // Prepare data for validation
  const dataToValidate = {
    product_id: formData.get("product_id"),
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
    existing_image_ids: existingImageIds,
    existing_detail_ids: existingDetailIds,
  };

  // Validate form data
  const {
    success,
    data: validData,
    error,
  } = productUpdateSchema.safeParse(dataToValidate);

  // Return validation errors if any
  if (!success) {
    return data(
      { fieldErrors: error.flatten().fieldErrors },
      { status: 400, headers },
    );
  }

  // Check if product exists and belongs to the user
  const [existingProduct] = await db
    .select()
    .from(products)
    .where(eq(products.product_id, validData.product_id))
    .limit(1);

  if (!existingProduct) {
    return data({ error: "상품을 찾을 수 없습니다" }, { status: 404, headers });
  }

  // Verify ownership
  if (existingProduct.created_by !== user.id) {
    return data({ error: "권한이 없습니다" }, { status: 403, headers });
  }

  // Generate slug if not provided
  const slug = validData.slug || generateSlug(validData.title);

  // Check if slug already exists (excluding current product)
  if (slug !== existingProduct.slug) {
    const [slugConflict] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (slugConflict && slugConflict.product_id !== validData.product_id) {
      return data(
        { error: "이미 사용 중인 slug입니다" },
        { status: 400, headers },
      );
    }
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

  // Track uploaded files for cleanup on error
  const uploadedFiles: string[] = [];

  try {
    // Get existing images
    const existingImagesList = await db
      .select()
      .from(productImages)
      .where(eq(productImages.product_id, validData.product_id));
    const existingImages = existingImagesList.sort(
      (a, b) => a.image_order - b.image_order,
    );

    // Delete images that are not in the keep list
    const imagesToDelete = existingImages.filter(
      (img) => !validData.existing_image_ids.includes(Number(img.image_id)),
    );

    // Delete old images from storage
    for (const img of imagesToDelete) {
      const filePath = extractFilePathFromUrl(img.image_url);
      if (filePath) {
        try {
          await client.storage.from("products").remove([filePath]);
        } catch (error) {
          // Log but don't fail
          console.error("Failed to delete image from storage:", error);
        }
      }
    }

    // Delete old images from database using Supabase client (to respect RLS)
    if (imagesToDelete.length > 0) {
      // Delete specific images by their IDs
      const imageIdsToDelete = imagesToDelete.map((img) => img.image_id);
      const { error: deleteError } = await client
        .from("product_images")
        .delete()
        .in("image_id", imageIdsToDelete);

      if (deleteError) {
        return data(
          { error: `이미지 삭제 실패: ${deleteError.message}` },
          { status: 400, headers },
        );
      }

      // 이미지 삭제는 이미 위에서 처리됨 (imagesToDelete)
    } else {
      // imagesToDelete.length === 0인 경우
      // 기존 이미지를 모두 유지하는 경우이거나, 모든 이미지를 교체하는 경우

      // 모든 기존 이미지를 삭제하는 경우는:
      // 1. 유지할 기존 이미지가 없고 (existing_image_ids.length === 0)
      // 2. 새 이미지가 있는 경우 (images.length > 0)
      if (
        validData.existing_image_ids.length === 0 &&
        validData.images.length > 0
      ) {
        // 모든 기존 이미지를 삭제하고 새 이미지로 교체
        const { error: deleteAllError } = await client
          .from("product_images")
          .delete()
          .eq("product_id", validData.product_id);

        if (deleteAllError) {
          return data(
            { error: `이미지 삭제 실패: ${deleteAllError.message}` },
            { status: 400, headers },
          );
        }
      }
      // 그 외의 경우 (기존 이미지를 유지하는 경우)는 아무것도 하지 않음
    }

    // Handle existing images - update order only (don't re-insert)
    // Sort by the order in validData.existing_image_ids (form submission order)
    const existingImagesToKeep = validData.existing_image_ids
      .map((id) => existingImages.find((img) => img.image_id === id))
      .filter((img): img is NonNullable<typeof img> => img !== undefined);

    // Update order for existing images in the form submission order
    if (existingImagesToKeep.length > 0) {
      for (let i = 0; i < existingImagesToKeep.length; i++) {
        const img = existingImagesToKeep[i];
        const { error: updateError } = await client
          .from("product_images")
          .update({ image_order: i })
          .eq("image_id", img.image_id);

        if (updateError) {
          return data(
            { error: `이미지 순서 업데이트 실패: ${updateError.message}` },
            { status: 400, headers },
          );
        }
      }
    }

    // Upload and insert only new images
    const newImageStartOrder = existingImagesToKeep.length;
    for (let i = 0; i < validData.images.length; i++) {
      const image = validData.images[i];
      const timestamp = Date.now();
      const fileName = `${timestamp}-${image.name}`;
      const filePath = `products/${validData.product_id}/${fileName}`;

      const { error: uploadError } = await client.storage
        .from("products")
        .upload(filePath, image, {
          upsert: false,
        });

      if (uploadError) {
        // Clean up uploaded files
        if (uploadedFiles.length > 0) {
          await client.storage.from("products").remove(uploadedFiles);
        }
        return data(
          { error: `이미지 업로드 실패: ${uploadError.message}` },
          { status: 400, headers },
        );
      }

      uploadedFiles.push(filePath);

      const {
        data: { publicUrl },
      } = await client.storage.from("products").getPublicUrl(filePath);

      // Insert only new images
      const { error: insertError } = await client
        .from("product_images")
        .insert({
          product_id: validData.product_id,
          image_url: publicUrl,
          image_order: newImageStartOrder + i,
        });

      if (insertError) {
        // Clean up uploaded files
        if (uploadedFiles.length > 0) {
          await client.storage.from("products").remove(uploadedFiles);
        }
        return data(
          { error: `이미지 저장 실패: ${insertError.message}` },
          { status: 400, headers },
        );
      }
    }

    // Get existing details
    const existingDetailsList = await db
      .select()
      .from(productDetails)
      .where(eq(productDetails.product_id, validData.product_id));
    const existingDetails = existingDetailsList.sort(
      (a, b) => a.detail_order - b.detail_order,
    );

    // Delete details that are not in the keep list
    const detailsToDelete = existingDetails.filter(
      (detail) =>
        !validData.existing_detail_ids.includes(Number(detail.detail_id)),
    );

    // Delete old detail images from storage
    for (const detail of detailsToDelete) {
      if (detail.detail_image_url) {
        const filePath = extractFilePathFromUrl(detail.detail_image_url);
        if (filePath) {
          try {
            await client.storage.from("products").remove([filePath]);
          } catch (error) {
            console.error("Failed to delete detail image from storage:", error);
          }
        }
      }
    }

    // Delete old details from database using Supabase client (to respect RLS)
    if (detailsToDelete.length > 0 || validData.details.length > 0) {
      // Delete all existing details
      const { error: deleteDetailsError } = await client
        .from("product_details")
        .delete()
        .eq("product_id", validData.product_id);

      if (deleteDetailsError) {
        // Clean up uploaded files
        if (uploadedFiles.length > 0) {
          await client.storage.from("products").remove(uploadedFiles);
        }
        return data(
          { error: `상세 정보 삭제 실패: ${deleteDetailsError.message}` },
          { status: 400, headers },
        );
      }
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

        // Find the specific existing detail by detail_id
        let existingDetail = null;
        if (detail.detail_id) {
          existingDetail = existingDetails.find(
            (d) => d.detail_id === detail.detail_id,
          );
        }

        if (detail.image) {
          // Delete old image if replacing existing detail image
          if (existingDetail?.detail_image_url) {
            const oldFilePath = extractFilePathFromUrl(
              existingDetail.detail_image_url,
            );
            if (oldFilePath) {
              try {
                await client.storage.from("products").remove([oldFilePath]);
              } catch (error) {
                // Log but don't fail
                console.error(
                  "Failed to delete old detail image from storage:",
                  error,
                );
              }
            }
          }

          // Upload new image
          const timestamp = Date.now();
          const fileName = `${timestamp}-${detail.image.name}`;
          const filePath = `products/${validData.product_id}/details/${i}/${fileName}`;

          const { error: uploadError } = await client.storage
            .from("products")
            .upload(filePath, detail.image, {
              upsert: false,
            });

          if (uploadError) {
            // Clean up uploaded files
            if (uploadedFiles.length > 0) {
              await client.storage.from("products").remove(uploadedFiles);
            }
            return data(
              { error: `상세 이미지 업로드 실패: ${uploadError.message}` },
              { status: 400, headers },
            );
          }

          uploadedFiles.push(filePath);

          const {
            data: { publicUrl },
          } = await client.storage.from("products").getPublicUrl(filePath);

          detailImageUrl = publicUrl;
        } else if (existingDetail?.detail_image_url) {
          // Keep existing image from the matched detail
          detailImageUrl = existingDetail.detail_image_url;
        }

        detailRecords.push({
          product_id: validData.product_id,
          detail_title: detail.title,
          detail_description: detail.description,
          detail_image_url: detailImageUrl,
          detail_order: i,
        });
      }

      // Insert product details using Supabase client (to respect RLS)
      const { error: detailInsertError } = await client
        .from("product_details")
        .insert(detailRecords);

      if (detailInsertError) {
        // Clean up uploaded files
        if (uploadedFiles.length > 0) {
          await client.storage.from("products").remove(uploadedFiles);
        }
        return data(
          { error: `상세 정보 저장 실패: ${detailInsertError.message}` },
          { status: 400, headers },
        );
      }
    }

    // Update product record
    await db
      .update(products)
      .set({
        title: validData.title,
        price: validData.price,
        difficulty: validData.difficulty ?? null,
        working_time: validData.working_time,
        width: validData.width ?? null,
        height: validData.height ?? null,
        depth: validData.depth ?? null,
        slug,
      })
      .where(eq(products.product_id, validData.product_id));

    // Return success response
    return data(
      {
        success: true,
        productId: validData.product_id,
        slug,
      },
      { headers },
    );
  } catch (error) {
    // Clean up uploaded files on error
    if (uploadedFiles.length > 0) {
      try {
        await client.storage.from("products").remove(uploadedFiles);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded files:", cleanupError);
      }
    }

    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "상품 수정 중 오류가 발생했습니다",
      },
      { status: 500, headers },
    );
  }
}
