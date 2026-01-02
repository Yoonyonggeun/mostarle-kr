/**
 * Product Database Queries
 *
 * This file contains functions for interacting with product records
 * in the database. It provides a clean interface for fetching product data
 * while handling errors appropriately.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * Retrieve all products for a specific user with their first image
 *
 * This function fetches all products created by the user, including
 * the first product image URL. The RLS policies ensure users can only
 * access their own products.
 *
 * @param client - Authenticated Supabase client instance
 * @param userId - The ID of the user whose products to retrieve
 * @returns An array of product records with first_image_url included
 * @throws Will throw an error if the database query fails
 */
export async function getProducts(
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) {
  // Query products with their images
  const { data: products, error: productsError } = await client
    .from("products")
    .select(
      `
      *,
      product_images (
        image_url,
        image_order
      )
    `,
    )
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (productsError) {
    throw productsError;
  }

  // Transform the data to include first image URL
  const productsWithFirstImage = products.map((product) => {
    const images =
      (product.product_images as Array<{
        image_url: string;
        image_order: number;
      }> | null) || [];

    // Get the first image (sorted by image_order)
    const firstImage = images.sort((a, b) => a.image_order - b.image_order)[0];

    return {
      ...product,
      first_image_url: firstImage?.image_url || null,
    };
  });

  return productsWithFirstImage;
}
