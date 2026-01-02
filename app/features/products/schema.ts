/**
 * Product Schema
 *
 * This file defines the database schema for products and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

/**
 * Standard timestamp columns for database tables
 *
 * Adds created_at and updated_at columns to any table where this object is spread.
 * Both columns are automatically set to the current timestamp when records are created,
 * and updated_at is refreshed when records are updated.
 */
const timestamps = {
  updated_at: timestamp().defaultNow().notNull(),
  created_at: timestamp().defaultNow().notNull(),
};

/**
 * Products Table
 *
 * Stores product information including title, price, difficulty, working time,
 * dimensions, and slug. Links to Supabase auth.users table via created_by foreign key.
 *
 * Includes Row Level Security (RLS) policies to ensure users can only
 * access and modify their own products.
 */
export const products = pgTable(
  "products",
  {
    // Auto-incrementing primary key for products
    product_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // Product title
    title: text().notNull(),
    // Product price
    price: doublePrecision().notNull(),
    // Difficulty level (1-5)
    difficulty: integer(),
    // Working time in minutes
    working_time: integer().notNull(),
    // Dimensions in mm
    width: doublePrecision(),
    height: doublePrecision(),
    depth: doublePrecision(),
    // URL-friendly slug (unique)
    slug: text().notNull().unique(),
    // Sold out status
    sold_out: boolean().notNull().default(false),
    // Foreign key to the user who created the product
    // Using CASCADE ensures product is deleted when user is deleted
    created_by: uuid().references(() => authUsers.id, {
      onDelete: "cascade",
    }),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can insert products with themselves as creator
    pgPolicy("insert-product-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.created_by}`,
    }),
    // RLS Policy: Users can only view their own products
    pgPolicy("select-product-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.created_by}`,
    }),
    // RLS Policy: Users can only update their own products
    pgPolicy("update-product-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.created_by}`,
      using: sql`${authUid} = ${table.created_by}`,
    }),
    // RLS Policy: Users can only delete their own products
    pgPolicy("delete-product-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`${authUid} = ${table.created_by}`,
    }),
  ],
);

/**
 * Product Images Table
 *
 * Stores multiple images for each product with ordering information.
 * Links to products table via product_id foreign key.
 */
export const productImages = pgTable(
  "product_images",
  {
    // Auto-incrementing primary key for product images
    image_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // Foreign key to products table
    // Using CASCADE ensures images are deleted when product is deleted
    product_id: bigint({ mode: "number" })
      .references(() => products.product_id, {
        onDelete: "cascade",
      })
      .notNull(),
    // Supabase Storage URL for the image
    image_url: text().notNull(),
    // Order of the image (for display sequence)
    image_order: integer().notNull(),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can insert images for their own products
    pgPolicy("insert-product-image-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
    // RLS Policy: Users can only view images of their own products
    pgPolicy("select-product-image-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
    // RLS Policy: Users can only update images of their own products
    pgPolicy("update-product-image-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
      using: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
    // RLS Policy: Users can only delete images of their own products
    pgPolicy("delete-product-image-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
  ],
);

/**
 * Product Details Table
 *
 * Stores detailed information for each product (dynamic array of details).
 * Each detail includes title, description, optional image, and ordering information.
 * Links to products table via product_id foreign key.
 */
export const productDetails = pgTable(
  "product_details",
  {
    // Auto-incrementing primary key for product details
    detail_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // Foreign key to products table
    // Using CASCADE ensures details are deleted when product is deleted
    product_id: bigint({ mode: "number" })
      .references(() => products.product_id, {
        onDelete: "cascade",
      })
      .notNull(),
    // Title of the detail section
    detail_title: text().notNull(),
    // Description of the detail section
    detail_description: text().notNull(),
    // Optional Supabase Storage URL for the detail image
    detail_image_url: text(),
    // Order of the detail (for display sequence)
    detail_order: integer().notNull(),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Users can insert details for their own products
    pgPolicy("insert-product-detail-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
    // RLS Policy: Users can only view details of their own products
    pgPolicy("select-product-detail-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
    // RLS Policy: Users can only update details of their own products
    pgPolicy("update-product-detail-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
      using: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
    // RLS Policy: Users can only delete details of their own products
    pgPolicy("delete-product-detail-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`EXISTS (
        SELECT 1 FROM ${products}
        WHERE ${products.product_id} = ${table.product_id}
        AND ${products.created_by} = ${authUid}
      )`,
    }),
  ],
);
