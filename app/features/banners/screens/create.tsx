/**
 * Create Banner Page
 *
 * This page allows creating a new banner.
 */
import type { Route } from "./+types/create";

import { requireAdminEmail } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import BannerForm from "../components/forms/banner-form";

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [{ title: `배너 생성 | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Loader function for create banner page
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // Verify admin email authorization
  await requireAdminEmail(client);

  return {};
}

/**
 * Create Banner component
 */
export default function Create({}: Route.ComponentProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10 pt-8 pb-8">
      <BannerForm mode="create" actionUrl="/api/banners/create" />
    </div>
  );
}

