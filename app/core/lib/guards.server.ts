/**
 * Authentication and Request Guards Module
 * 
 * This module provides utility functions for protecting routes and API endpoints
 * by enforcing authentication and HTTP method requirements. These guards are designed
 * to be used in React Router loaders and actions to ensure proper access control
 * and request validation.
 * 
 * The module includes:
 * - Authentication guard to ensure a user is logged in
 * - HTTP method guard to ensure requests use the correct HTTP method
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { data } from "react-router";

/**
 * Require user authentication for a route or action
 * 
 * This function checks if a user is currently authenticated by querying the Supabase
 * client. If no user is found, it throws a 401 Unauthorized response, which will be
 * handled by React Router's error boundary system.
 * 
 * @example
 * // In a loader or action function
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireAuthentication(client);
 *   
 *   // Continue with authenticated logic...
 *   return json({ ... });
 * }
 * 
 * @param client - The Supabase client instance to use for authentication check
 * @throws {Response} 401 Unauthorized if no user is authenticated
 */
export async function requireAuthentication(client: SupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw data(null, { status: 401 });
  }
}

/**
 * Require admin email for a route or action
 * 
 * This function checks if a user is authenticated and has the specified admin email.
 * If the user is not authenticated or doesn't have the required email, it throws
 * a 403 Forbidden response.
 * 
 * @example
 * // In a loader or action function
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireAdminEmail(client);
 *   
 *   // Continue with admin-only logic...
 *   return json({ ... });
 * }
 * 
 * @param client - The Supabase client instance to use for authentication check
 * @param allowedEmail - The email address that is allowed to access (default: "yoon5ye@gmail.com")
 * @returns The authenticated user if authorized
 * @throws {Response} 401 Unauthorized if no user is authenticated
 * @throws {Response} 403 Forbidden if user email doesn't match the allowed email
 */
export async function requireAdminEmail(
  client: SupabaseClient,
  allowedEmail: string = "yoon5ye@gmail.com",
) {
  const {
    data: { user },
  } = await client.auth.getUser();
  
  if (!user) {
    throw data(null, { status: 401 });
  }
  
  if (user.email !== allowedEmail) {
    throw data(null, { status: 403 });
  }
  
  return user;
}

/**
 * Require a specific HTTP method for a route action
 * 
 * This function returns a middleware that checks if the incoming request uses
 * the specified HTTP method. If not, it throws a 405 Method Not Allowed response.
 * This is useful for ensuring that endpoints only accept the intended HTTP methods.
 * 
 * @example
 * // In an action function
 * export async function action({ request }: ActionArgs) {
 *   requireMethod('POST')(request);
 *   
 *   // Continue with POST-specific logic...
 *   return json({ ... });
 * }
 * 
 * @param method - The required HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
 * @returns A function that validates the request method
 * @throws {Response} 405 Method Not Allowed if the request uses an incorrect method
 */
export function requireMethod(method: string) {
  return (request: Request) => {
    if (request.method !== method) {
      throw data(null, { status: 405 });
    }
  };
}
