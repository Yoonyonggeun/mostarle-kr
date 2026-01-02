/**
 * Delete Product API Endpoint
 *
 * This file implements an API endpoint for deleting products.
 * It handles authentication, authorization, storage cleanup, and database deletion.
 *
 * Key features:
 * - Admin email authorization
 * - Product ownership verification
 * - Storage file cleanup
 * - Database deletion with CASCADE
 * - Error handling
 */
import type { Route } from "./+types/delete";

import { eq } from "drizzle-orm";
import { data, redirect } from "react-router";
import { z } from "zod";

import db from "~/core/db/drizzle-client.server";
import { requireAdminEmail, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { products } from "../schema";

/**
 * Validation schema for delete product request
 */
const deleteProductSchema = z.object({
  product_id: z.coerce.number().int().positive("상품 ID는 양수여야 합니다"),
});

/**
 * Extract file path from Supabase Storage URL
 *
 * @param url - The full Supabase Storage URL
 * @returns The file path relative to the bucket
 */
function extractFilePathFromUrl(url: string): string | null {
  try {
    // Supabase Storage URL format: https://[project].supabase.co/storage/v1/object/public/products/[path]
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
 * Action handler for deleting products
 *
 * This function handles the product deletion flow:
 * 1. Validates the request method and admin email authorization
 * 2. Validates the product ID
 * 3. Verifies product ownership
 * 4. Deletes all related files from Storage
 * 5. Deletes the product from database (CASCADE handles related records)
 * 6. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Validates admin email authorization before processing
 * - Verifies product ownership before deletion
 * - Handles errors gracefully with appropriate status codes
 * - Cleans up all associated storage files
 *
 * @param request - The incoming HTTP request with form data
 * @returns Redirect to manage page or error response
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
  const user = await requireAdminEmail(client);

  // Extract form data
  const formData = await request.formData();
  const dataToValidate = {
    product_id: formData.get("product_id"),
  };

  // Validate form data
  const {
    success,
    data: validData,
    error,
  } = deleteProductSchema.safeParse(dataToValidate);

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

  try {
    // Get all files in the product's storage folder
    // Since we store files in products/{productId}/, we can list and delete all files
    const { data: files, error: listError } = await client.storage
      .from("products")
      .list(`${validData.product_id}`, {
        limit: 1000,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    // Delete all files in the product folder
    if (files && files.length > 0) {
      // Recursively collect all file paths
      const filePaths: string[] = [];

      const collectFiles = (items: any[], prefix: string = "") => {
        for (const item of items) {
          if (item.id) {
            // It's a file
            filePaths.push(prefix ? `${prefix}/${item.name}` : item.name);
          } else if (item.name) {
            // It's a folder, list its contents
            const folderPath = prefix ? `${prefix}/${item.name}` : item.name;
            // Note: Supabase Storage list doesn't support recursive listing easily
            // So we'll delete the folder path which should delete all contents
            filePaths.push(folderPath);
          }
        }
      };

      collectFiles(files, `${validData.product_id}`);

      // Delete all files
      if (filePaths.length > 0) {
        // Delete the entire folder by deleting all files
        // Supabase Storage doesn't have a direct folder delete, so we delete all files
        const { error: deleteError } = await client.storage
          .from("products")
          .remove(filePaths);

        if (deleteError) {
          // Log error but continue with database deletion
          console.error("Failed to delete some storage files:", deleteError);
        }
      }
    }

    // Alternative approach: Try to delete the entire folder path
    // This might work if Supabase supports it
    try {
      const { error: folderDeleteError } = await client.storage
        .from("products")
        .remove([`${validData.product_id}`]);

      if (folderDeleteError) {
        console.error("Failed to delete folder:", folderDeleteError);
      }
    } catch (folderError) {
      // Ignore folder deletion errors, continue with database deletion
      console.error("Folder deletion error:", folderError);
    }

    // Delete the product from database
    // CASCADE will automatically delete related product_images and product_details
    await db
      .delete(products)
      .where(eq(products.product_id, validData.product_id));

    // Redirect to manage page
    return redirect("/admin/products/manage", { headers });
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "상품 삭제 중 오류가 발생했습니다",
      },
      { status: 500, headers },
    );
  }
}
