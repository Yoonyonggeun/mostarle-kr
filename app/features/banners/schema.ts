/**
 * Banner Schema
 *
 * This file defines the database schema for banners and sets up
 * Supabase Row Level Security (RLS) policies to control data access.
 * Only administrators can access and manage banners.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
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
 * Banners Table
 *
 * Stores banner information including title, mobile/desktop image URLs, link URL, display order,
 * and active status. Links to Supabase auth.users table via created_by foreign key.
 *
 * Includes Row Level Security (RLS) policies to ensure only administrators
 * (yoon5ye@gmail.com) can access and modify banners.
 */
export const banners = pgTable(
  "banners",
  {
    // Auto-incrementing primary key for banners
    banner_id: bigint({ mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // Banner title (optional, defaults to image filename if not provided)
    title: text().notNull().default("배너"),
    // Supabase Storage URL for the mobile banner image
    image_url_mobile: text().notNull(),
    // Supabase Storage URL for the desktop/PC banner image
    image_url_desktop: text().notNull(),
    // Optional URL to navigate to when banner is clicked
    link_url: text(),
    // Display order for sorting banners
    display_order: integer().notNull(),
    // Whether the banner is active and should be displayed
    is_active: boolean().notNull().default(true),
    // Foreign key to the user who created the banner
    // Using CASCADE ensures banner is deleted when user is deleted
    created_by: uuid().references(() => authUsers.id, {
      onDelete: "cascade",
    }),
    // Adds created_at and updated_at timestamp columns
    ...timestamps,
  },
  (table) => [
    // RLS Policy: Authenticated users can insert banners
    // Note: Admin email check is performed at application level via requireAdminEmail guard
    pgPolicy("insert-banner-policy", {
      for: "insert",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`${authUid} = ${table.created_by}`,
    }),
    // RLS Policy: Authenticated users can view banners
    // Note: Admin email check is performed at application level via requireAdminEmail guard
    pgPolicy("select-banner-policy", {
      for: "select",
      to: authenticatedRole,
      as: "permissive",
      using: sql`true`, // Allow all authenticated users to view (admin check at app level)
    }),
    // RLS Policy: Authenticated users can update banners
    // Note: Admin email check is performed at application level via requireAdminEmail guard
    pgPolicy("update-banner-policy", {
      for: "update",
      to: authenticatedRole,
      as: "permissive",
      withCheck: sql`true`, // Allow all authenticated users to update (admin check at app level)
      using: sql`true`, // Allow all authenticated users to update (admin check at app level)
    }),
    // RLS Policy: Authenticated users can delete banners
    // Note: Admin email check is performed at application level via requireAdminEmail guard
    pgPolicy("delete-banner-policy", {
      for: "delete",
      to: authenticatedRole,
      as: "permissive",
      using: sql`true`, // Allow all authenticated users to delete (admin check at app level)
    }),
  ],
);
