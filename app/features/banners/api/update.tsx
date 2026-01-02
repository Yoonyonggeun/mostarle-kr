/**
 * Update Banner API Endpoint
 *
 * This file implements an API endpoint for updating existing banners.
 * It handles form data processing, validation, image management, and database updates.
 *
 * Key features:
 * - Form data validation with Zod schema
 * - Optional image upload handling
 * - Storage management with Supabase Storage
 * - Banner data update
 * - Comprehensive error handling
 * - Admin email authorization
 */
import type { Route } from "./+types/update";

import { data, redirect } from "react-router";
import { z } from "zod";

import { requireAdminEmail, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getBanner } from "../lib/queries.server";

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
      /\/storage\/v1\/object\/public\/banners\/(.+)/,
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
 * Validation schema for banner update form data
 */
const bannerUpdateSchema = z.object({
  banner_id: z.coerce.number().int().positive("배너 ID는 양수여야 합니다"),
  link_url: z.string().url("유효한 URL을 입력하세요").optional().or(z.literal("")),
  display_order: z.coerce.number().int().optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => val === "on" || val === "true"),
  image_mobile: z.instanceof(File).optional(),
  image_desktop: z.instanceof(File).optional(),
});

/**
 * Action handler for processing banner update requests
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow POST)
  requireMethod("POST")(request);

  // Create a server-side Supabase client with the user's session
  const [client, headers] = makeServerClient(request);

  // Verify admin email authorization
  await requireAdminEmail(client);

  // Extract form data
  const formData = await request.formData();

  // Extract image files (handle null/empty values)
  const imageMobile = formData.get("image_mobile");
  const imageDesktop = formData.get("image_desktop");

  // Prepare data for validation
  const dataToValidate = {
    banner_id: formData.get("banner_id"),
    link_url: formData.get("link_url"),
    display_order: formData.get("display_order"),
    is_active: formData.get("is_active"),
    // Only include file if it's a valid File instance with size > 0
    image_mobile:
      imageMobile instanceof File && imageMobile.size > 0
        ? imageMobile
        : undefined,
    image_desktop:
      imageDesktop instanceof File && imageDesktop.size > 0
        ? imageDesktop
        : undefined,
  };

  // Validate form data
  const {
    success,
    data: validData,
    error,
  } = bannerUpdateSchema.safeParse(dataToValidate);

  // Return validation errors if any
  if (!success) {
    return data(
      { fieldErrors: error.flatten().fieldErrors },
      { status: 400, headers },
    );
  }

  // Check if banner exists
  let existingBanner;
  try {
    existingBanner = await getBanner(client, validData.banner_id);
  } catch (error) {
    return data(
      { error: "배너를 찾을 수 없습니다" },
      { status: 404, headers },
    );
  }

  // Track uploaded files for cleanup on failure
  const uploadedFiles: string[] = [];
  let newMobileImageUrl = existingBanner.image_url_mobile;
  let newDesktopImageUrl = existingBanner.image_url_desktop;

  try {
    // Handle mobile image upload if new image is provided
    if (validData.image_mobile instanceof File && validData.image_mobile.size > 0) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (validData.image_mobile.size > maxSize) {
        return data(
          { error: "모바일 이미지 크기는 5MB를 초과할 수 없습니다" },
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

      // Delete old mobile image from storage
      const oldMobileFilePath = extractFilePathFromUrl(existingBanner.image_url_mobile);
      if (oldMobileFilePath) {
        const { error: deleteError } = await client.storage
          .from("banners")
          .remove([oldMobileFilePath]);

        if (deleteError) {
          console.error("Failed to delete old mobile image:", deleteError);
        }
      }

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${timestamp}-mobile-${validData.image_mobile.name}`;
      const filePath = `banners/${fileName}`;

      // Upload new mobile image to Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from("banners")
        .upload(filePath, validData.image_mobile, {
          upsert: false,
        });

      if (uploadError) {
        console.error("Mobile image upload error:", uploadError);
        return data(
          {
            error: `모바일 이미지 업로드 실패: ${uploadError.message}`,
          },
          { status: 400, headers },
        );
      }

      uploadedFiles.push(filePath);

      // Get public URL for the uploaded mobile image
      const {
        data: { publicUrl },
      } = client.storage.from("banners").getPublicUrl(filePath);

      newMobileImageUrl = publicUrl;
    }

    // Handle desktop image upload if new image is provided
    if (validData.image_desktop instanceof File && validData.image_desktop.size > 0) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (validData.image_desktop.size > maxSize) {
        return data(
          { error: "PC 이미지 크기는 5MB를 초과할 수 없습니다" },
          { status: 400, headers },
        );
      }

      // Validate file type
      if (!validData.image_desktop.type.startsWith("image/")) {
        return data(
          { error: "PC 이미지는 이미지 파일만 업로드할 수 있습니다" },
          { status: 400, headers },
        );
      }

      // Delete old desktop image from storage
      const oldDesktopFilePath = extractFilePathFromUrl(existingBanner.image_url_desktop);
      if (oldDesktopFilePath) {
        const { error: deleteError } = await client.storage
          .from("banners")
          .remove([oldDesktopFilePath]);

        if (deleteError) {
          console.error("Failed to delete old desktop image:", deleteError);
        }
      }

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${timestamp}-desktop-${validData.image_desktop.name}`;
      const filePath = `banners/${fileName}`;

      // Upload new desktop image to Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from("banners")
        .upload(filePath, validData.image_desktop, {
          upsert: false,
        });

      if (uploadError) {
        console.error("Desktop image upload error:", uploadError);
        return data(
          {
            error: `PC 이미지 업로드 실패: ${uploadError.message}`,
          },
          { status: 400, headers },
        );
      }

      uploadedFiles.push(filePath);

      // Get public URL for the uploaded desktop image
      const {
        data: { publicUrl },
      } = client.storage.from("banners").getPublicUrl(filePath);

      newDesktopImageUrl = publicUrl;
    }

    // Update banner using Supabase client (to respect RLS)
    const updateData: {
      image_url_mobile: string;
      image_url_desktop: string;
      link_url: string | null;
      display_order: number;
      is_active: boolean;
    } = {
      image_url_mobile: newMobileImageUrl,
      image_url_desktop: newDesktopImageUrl,
      link_url: validData.link_url || null,
      display_order: validData.display_order ?? existingBanner.display_order,
      is_active: validData.is_active ?? existingBanner.is_active,
    };

    const { data: bannerData, error: updateError } = await client
      .from("banners")
      .update(updateData)
      .eq("banner_id", validData.banner_id)
      .select()
      .single();

    if (updateError) {
      // Clean up uploaded file on failure
      if (uploadedFiles.length > 0) {
        await client.storage.from("banners").remove(uploadedFiles);
      }
      console.error("Banner update error:", updateError);
      return data(
        {
          error: `배너 수정 실패: ${updateError.message}`,
        },
        { status: 400, headers },
      );
    }

    // Redirect to banner list page on success
    return redirect("/admin/banners/manage", { headers });
  } catch (error) {
    // Clean up uploaded files on error
    if (uploadedFiles.length > 0) {
      await client.storage.from("banners").remove(uploadedFiles).catch((err) => {
        console.error("Failed to clean up files:", err);
      });
    }

    console.error("Unexpected error:", error);
    return data(
      {
        error:
          error instanceof Error ? error.message : "배너 수정 중 오류가 발생했습니다",
      },
      { status: 500, headers },
    );
  }
}

