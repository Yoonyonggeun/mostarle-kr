/**
 * Toggle Sold Out Status API Endpoint
 *
 * This file implements an API endpoint for toggling the sold_out status of a product.
 * It handles authentication, authorization, and status updates.
 *
 * Key features:
 * - Admin email authorization
 * - Product ownership verification
 * - Sold out status toggle
 * - Error handling
 */
import type { Route } from "./+types/toggle-sold-out";

import { eq } from "drizzle-orm";
import { data } from "react-router";
import { z } from "zod";

import db from "~/core/db/drizzle-client.server";
import { requireAdminEmail, requireMethod } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { products } from "../schema";

/**
 * Validation schema for toggle sold out request
 */
const toggleSoldOutSchema = z.object({
  product_id: z.coerce.number().int().positive("상품 ID는 양수여야 합니다"),
});

/**
 * Action handler for toggling sold out status
 *
 * This function handles the sold out status toggle flow:
 * 1. Validates the request method and admin email authorization
 * 2. Validates the product ID
 * 3. Verifies product ownership
 * 4. Toggles the sold_out status
 * 5. Returns appropriate success or error responses
 *
 * Security considerations:
 * - Validates admin email authorization before processing
 * - Verifies product ownership before updating
 * - Handles errors gracefully with appropriate status codes
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
  const dataToValidate = {
    product_id: formData.get("product_id"),
  };

  // Validate form data
  const {
    success,
    data: validData,
    error,
  } = toggleSoldOutSchema.safeParse(dataToValidate);

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

  // Toggle sold_out status
  const [updatedProduct] = await db
    .update(products)
    .set({
      sold_out: !existingProduct.sold_out,
    })
    .where(eq(products.product_id, validData.product_id))
    .returning();

  // Return success response
  return data(
    {
      success: true,
      sold_out: updatedProduct.sold_out,
    },
    { headers },
  );
}
