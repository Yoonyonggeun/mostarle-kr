/**
 * Edit Banner Loader
 *
 * This file contains the loader function for the edit banner page.
 * It fetches the banner data from the database.
 */
import { data } from "react-router";

import { requireAdminEmail } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { getBanner } from "../lib/queries.server";

/**
 * Loader function for fetching banner data for editing
 *
 * @param request - The incoming HTTP request
 * @param bannerId - The ID of the banner to fetch
 * @returns Banner data
 */
export async function editLoader(request: Request, bannerId: number) {
  const [client, headers] = makeServerClient(request);

  // Verify admin email authorization
  await requireAdminEmail(client);

  // Get banner
  try {
    const banner = await getBanner(client, bannerId);
    return { banner };
  } catch (error) {
    throw data(
      { error: "배너를 찾을 수 없습니다" },
      { status: 404, headers },
    );
  }
}

