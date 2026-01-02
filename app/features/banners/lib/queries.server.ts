/**
 * Banner Server Queries
 *
 * This file contains server-side query functions for fetching banner data.
 * All queries use the Supabase client to respect Row Level Security (RLS) policies.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";

import { banners } from "../schema";

/**
 * Get all banners ordered by display_order
 *
 * @param client - Supabase client instance
 * @returns Array of banners sorted by display_order
 */
export async function getBanners(client: SupabaseClient) {
  const { data, error } = await client
    .from("banners")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching banners:", error);
    throw new Error(`Failed to fetch banners: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single banner by ID
 *
 * @param client - Supabase client instance
 * @param bannerId - The ID of the banner to fetch
 * @returns Banner object or null if not found
 */
export async function getBanner(
  client: SupabaseClient,
  bannerId: number,
) {
  const { data, error } = await client
    .from("banners")
    .select("*")
    .eq("banner_id", bannerId)
    .single();

  if (error) {
    console.error("Error fetching banner:", error);
    throw new Error(`Failed to fetch banner: ${error.message}`);
  }

  return data;
}

/**
 * Get the maximum display_order value
 * Used for setting the order of new banners
 *
 * @param client - Supabase client instance
 * @returns Maximum display_order value or 0 if no banners exist
 */
export async function getMaxDisplayOrder(client: SupabaseClient) {
  const { data, error } = await client
    .from("banners")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // If no banners exist, return 0
    if (error.code === "PGRST116") {
      return 0;
    }
    console.error("Error fetching max display order:", error);
    throw new Error(`Failed to fetch max display order: ${error.message}`);
  }

  return data?.display_order || 0;
}

/**
 * Get all active banners ordered by display_order
 * 
 * This function is designed for public display on the home page.
 * It only returns banners that are marked as active (is_active = true).
 * 
 * @param client - Supabase client instance (can be anonymous/public client)
 * @returns Array of active banners sorted by display_order
 */
export async function getActiveBanners(client: SupabaseClient) {
  const { data, error } = await client
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching active banners:", error);
    throw new Error(`Failed to fetch active banners: ${error.message}`);
  }

  return data || [];
}

