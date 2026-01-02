/**
 * Banner Management Page
 *
 * This page displays a list of all banners with management actions.
 * It includes authentication protection and banner listing.
 */
import type { Route } from "./+types/manage";

import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card } from "~/core/components/ui/card";
import { requireAdminEmail } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import BannerManageTable from "../components/banner-manage-table";
import { getBanners } from "../lib/queries.server";

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [{ title: `배너 관리 | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Loader function for fetching banner list
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // Verify admin email authorization
  const user = await requireAdminEmail(client);

  // Fetch banners
  const banners = await getBanners(client);

  return { banners };
}

/**
 * Banner Management component
 */
export default function Manage({ loaderData }: Route.ComponentProps) {
  const { banners } = loaderData;

  return (
    <div className="flex w-full flex-col items-center gap-10 pt-0 pb-8">
      <Card className="w-full max-w-screen-xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">배너 관리</h1>
          <Button asChild>
            <Link to="/admin/banners/create">배너 생성하기</Link>
          </Button>
        </div>

        {banners.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground text-lg">
              등록된 배너가 없습니다
            </p>
            <Button asChild>
              <Link to="/admin/banners/create">배너 생성하기</Link>
            </Button>
          </div>
        ) : (
          <BannerManageTable banners={banners} />
        )}
      </Card>
    </div>
  );
}

