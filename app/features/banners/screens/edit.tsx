/**
 * Edit Banner Page
 *
 * This page allows editing an existing banner.
 * It loads the banner data and displays the form with initial values.
 */
import type { Route } from "./+types/edit";

import BannerForm from "../components/forms/banner-form";
import { editLoader } from "./edit.loader.server";

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [{ title: `배너 수정 | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Loader function for fetching banner data
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  // Get banner ID from params
  const bannerId = parseInt(params.id || "", 10);
  if (isNaN(bannerId)) {
    throw new Response("유효하지 않은 배너 ID입니다", { status: 400 });
  }

  return editLoader(request, bannerId);
}

/**
 * Edit Banner component
 */
export default function Edit({ loaderData }: Route.ComponentProps) {
  const { banner } = loaderData;

  return (
    <div className="flex w-full flex-col items-center gap-10 pt-8 pb-8">
      <BannerForm
        initialData={banner}
        mode="edit"
        actionUrl="/api/banners/update"
      />
    </div>
  );
}

