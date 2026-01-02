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

/**
 * Retrieve all public products with their first image
 *
 * This function fetches all non-sold-out products for public display on the home page.
 * It includes the first product image URL sorted by image_order.
 * The RLS policies allow anonymous users to view all products.
 *
 * @param client - Supabase client instance (can be anonymous/public client)
 * @returns An array of public product records with first_image_url included
 * @throws Will throw an error if the database query fails
 */
export async function getAllPublicProducts(
  client: SupabaseClient<Database>,
) {
  // Query products with their images, excluding sold out products
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
    .eq("sold_out", false)
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

/**
 * Get a single product by slug with all images and details
 *
 * This function fetches a single product by its slug, including all product images
 * sorted by image_order and all product details sorted by detail_order.
 * Unlike getAllPublicProducts, this function does not filter out sold-out products,
 * as product detail pages should display all products regardless of availability.
 * The RLS policies allow anonymous users to view all products.
 *
 * @param client - Supabase client instance (can be anonymous/public client)
 * @param slug - The slug of the product to retrieve
 * @returns A product record with images and details, or null if not found
 * @throws Will throw an error if the database query fails
 */
export async function getProductBySlug(
  client: SupabaseClient<Database>,
  slug: string,
) {
  // Query product by slug with images and details
  const { data: product, error: productError } = await client
    .from("products")
    .select(
      `
      *,
      product_images (
        image_id,
        image_url,
        image_order
      ),
      product_details (
        detail_id,
        detail_title,
        detail_description,
        detail_image_url,
        detail_order
      )
    `,
    )
    .eq("slug", slug)
    .single();

  if (productError) {
    // If product not found, return null
    if (productError.code === "PGRST116") {
      return null;
    }
    throw productError;
  }

  if (!product) {
    return null;
  }

  // Sort images by image_order
  const images =
    (product.product_images as Array<{
      image_id: number;
      image_url: string;
      image_order: number;
    }> | null) || [];
  const sortedImages = images.sort((a, b) => a.image_order - b.image_order);

  // Sort details by detail_order
  const details =
    (product.product_details as Array<{
      detail_id: number;
      detail_title: string;
      detail_description: string;
      detail_image_url: string | null;
      detail_order: number;
    }> | null) || [];
  const sortedDetails = details.sort((a, b) => a.detail_order - b.detail_order);

  return {
    ...product,
    product_images: sortedImages,
    product_details: sortedDetails,
  };
}
