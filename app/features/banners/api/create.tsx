/**
 * Create Banner API Endpoint
 *
 * This file implements an API endpoint for creating new banners.
 * It handles form data processing, validation, image upload, and database updates.
 *
 * Key features:
 * - Form data validation with Zod schema
 * - Image upload handling for banner images
 * - Storage management with Supabase Storage
 * - Banner data creation
 * - Comprehensive error handling
 * - Admin email authorization
 */
import type { Route } from "./+types/create";

import { data } from "react-router";
import { z } from "zod";

import { requireAdminEmail, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getMaxDisplayOrder } from "../lib/queries.server";

/**
 * Validation schema for banner creation form data
 */
const bannerSchema = z.object({
  title: z.string().optional().default(""),
  link_url: z
    .string()
    .url("유효한 URL을 입력하세요")
    .optional()
    .or(z.literal("")),
  display_order: z.coerce.number().int().optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => val === "on" || val === "true"),
  image_mobile: z
    .instanceof(File)
    .refine((file) => file.size > 0, "모바일 이미지가 필요합니다"),
  image_desktop: z
    .instanceof(File)
    .refine((file) => file.size > 0, "PC 이미지가 필요합니다"),
});

/**
 * Action handler for processing banner creation requests
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

  // Prepare data for validation
  const dataToValidate = {
    title: formData.get("title"),
    link_url: formData.get("link_url"),
    display_order: formData.get("display_order"),
    is_active: formData.get("is_active"),
    image_mobile: formData.get("image_mobile"),
    image_desktop: formData.get("image_desktop"),
  };

  // Validate form data
  const {
    success,
    data: validData,
    error,
  } = bannerSchema.safeParse(dataToValidate);

  // Return validation errors if any
  if (!success) {
    return data(
      { fieldErrors: error.flatten().fieldErrors },
      { status: 400, headers },
    );
  }

  // Validate mobile image file
  if (
    !(validData.image_mobile instanceof File) ||
    validData.image_mobile.size === 0
  ) {
    return data(
      { error: "모바일 이미지 파일이 필요합니다" },
      { status: 400, headers },
    );
  }

  // Validate desktop image file
  if (
    !(validData.image_desktop instanceof File) ||
    validData.image_desktop.size === 0
  ) {
    return data(
      { error: "PC 이미지 파일이 필요합니다" },
      { status: 400, headers },
    );
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (validData.image_mobile.size > maxSize) {
    return data(
      { error: "모바일 이미지 크기는 5MB를 초과할 수 없습니다" },
      { status: 400, headers },
    );
  }
  if (validData.image_desktop.size > maxSize) {
    return data(
      { error: "PC 이미지 크기는 5MB를 초과할 수 없습니다" },
      { status: 400, headers },
    );
  }

  // Validate file type
  if (!validData.image_mobile.type.startsWith("image/")) {
    return data(
      { error: "모바일 이미지는 이미지 파일만 업로드할 수 있습니다" },
      { status: 400, headers },
    );
  }
  if (!validData.image_desktop.type.startsWith("image/")) {
    return data(
      { error: "PC 이미지는 이미지 파일만 업로드할 수 있습니다" },
      { status: 400, headers },
    );
  }

  // Get max display order if not provided
  let displayOrder: number;
  if (validData.display_order === undefined) {
    displayOrder = (await getMaxDisplayOrder(client)) + 1;
  } else {
    displayOrder = validData.display_order;
  }

  // Track uploaded files for cleanup on failure
  const uploadedFiles: string[] = [];

  try {
    // Upload mobile image
    const timestamp = Date.now();
    const mobileFileName = `${timestamp}-mobile-${validData.image_mobile.name}`;
    const mobileFilePath = `banners/${mobileFileName}`;

    const { data: mobileUploadData, error: mobileUploadError } =
      await client.storage
        .from("banners")
        .upload(mobileFilePath, validData.image_mobile, {
          upsert: false,
        });

    if (mobileUploadError) {
      console.error("Mobile image upload error:", mobileUploadError);
      return data(
        {
          error: `모바일 이미지 업로드 실패: ${mobileUploadError.message}`,
        },
        { status: 400, headers },
      );
    }

    uploadedFiles.push(mobileFilePath);

    // Upload desktop image
    const desktopFileName = `${timestamp}-desktop-${validData.image_desktop.name}`;
    const desktopFilePath = `banners/${desktopFileName}`;

    const { data: desktopUploadData, error: desktopUploadError } =
      await client.storage
        .from("banners")
        .upload(desktopFilePath, validData.image_desktop, {
          upsert: false,
        });

    if (desktopUploadError) {
      // Clean up mobile image on failure
      if (uploadedFiles.length > 0) {
        await client.storage.from("banners").remove(uploadedFiles);
      }
      console.error("Desktop image upload error:", desktopUploadError);
      return data(
        {
          error: `PC 이미지 업로드 실패: ${desktopUploadError.message}`,
        },
        { status: 400, headers },
      );
    }

    uploadedFiles.push(desktopFilePath);

    // Get public URLs for the uploaded images
    const {
      data: { publicUrl: mobilePublicUrl },
    } = client.storage.from("banners").getPublicUrl(mobileFilePath);

    const {
      data: { publicUrl: desktopPublicUrl },
    } = client.storage.from("banners").getPublicUrl(desktopFilePath);

    // Generate title from image filename if not provided
    const bannerTitle =
      validData.title ||
      validData.image_mobile.name.replace(/\.[^/.]+$/, "") ||
      "배너";

    // Insert banner using Supabase client (to respect RLS)
    const { data: bannerData, error: insertError } = await client
      .from("banners")
      .insert({
        title: bannerTitle,
        image_url_mobile: mobilePublicUrl,
        image_url_desktop: desktopPublicUrl,
        link_url: validData.link_url || null,
        display_order: displayOrder,
        is_active: validData.is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file on failure
      if (uploadedFiles.length > 0) {
        await client.storage.from("banners").remove(uploadedFiles);
      }
      console.error("Banner insert error:", insertError);
      return data(
        {
          error: `배너 생성 실패: ${insertError.message}`,
        },
        { status: 400, headers },
      );
    }

    // Return success response
    return data(
      {
        success: true,
        banner: bannerData,
      },
      { status: 201, headers },
    );
  } catch (error) {
    // Clean up uploaded files on error
    if (uploadedFiles.length > 0) {
      await client.storage
        .from("banners")
        .remove(uploadedFiles)
        .catch((err) => {
          console.error("Failed to clean up files:", err);
        });
    }

    console.error("Unexpected error:", error);
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "배너 생성 중 오류가 발생했습니다",
      },
      { status: 500, headers },
    );
  }
}
