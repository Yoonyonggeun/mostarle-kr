/**
 * Delete Banner API Endpoint
 *
 * This file implements an API endpoint for deleting banners.
 * It handles authentication, authorization, storage cleanup, and database deletion.
 *
 * Key features:
 * - Admin email authorization
 * - Storage file cleanup
 * - Database deletion
 * - Error handling
 */
import type { Route } from "./+types/delete";

import { data, redirect } from "react-router";
import { z } from "zod";

import { requireAdminEmail, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getBanner } from "../lib/queries.server";

/**
 * Validation schema for delete banner request
 */
const deleteBannerSchema = z.object({
  banner_id: z.coerce.number().int().positive("배너 ID는 양수여야 합니다"),
});

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
 * Action handler for deleting banners
 */
export async function action({ request }: Route.ActionArgs) {
  // Validate request method (only allow DELETE or POST)
  const method = request.method;
  if (method !== "DELETE" && method !== "POST") {
    requireMethod("DELETE")(request);
  }

  // Create a server-side Supabase client with the user's session
  const [client, headers] = makeServerClient(request);

  // Verify admin email authorization
  await requireAdminEmail(client);

  // Extract form data
  const formData = await request.formData();
  const dataToValidate = {
    banner_id: formData.get("banner_id"),
  };

  // Validate form data
  const {
    success,
    data: validData,
    error,
  } = deleteBannerSchema.safeParse(dataToValidate);

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

  try {
    // Delete mobile image from storage
    const mobileFilePath = extractFilePathFromUrl(existingBanner.image_url_mobile);
    if (mobileFilePath) {
      const { error: deleteError } = await client.storage
        .from("banners")
        .remove([mobileFilePath]);

      if (deleteError) {
        console.error("Failed to delete mobile storage file:", deleteError);
      }
    }

    // Delete desktop image from storage
    const desktopFilePath = extractFilePathFromUrl(existingBanner.image_url_desktop);
    if (desktopFilePath) {
      const { error: deleteError } = await client.storage
        .from("banners")
        .remove([desktopFilePath]);

      if (deleteError) {
        console.error("Failed to delete desktop storage file:", deleteError);
      }
    }

    // Delete the banner from database
    const { error: dbError } = await client
      .from("banners")
      .delete()
      .eq("banner_id", validData.banner_id);

    if (dbError) {
      console.error("Database deletion error:", dbError);
      return data(
        {
          error: `배너 삭제 실패: ${dbError.message}`,
        },
        { status: 400, headers },
      );
    }

    // Redirect to manage page
    return redirect("/admin/banners/manage", { headers });
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "배너 삭제 중 오류가 발생했습니다",
      },
      { status: 500, headers },
    );
  }
}

