import type { Route } from "./+types/index";

import { Link } from "react-router";
import { ImageIcon, PackageIcon } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
import { requireAdminEmail } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [{ title: `관리자 대시보드 | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Loader function for admin dashboard
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // Verify admin email authorization
  await requireAdminEmail(client);

  return {};
}

/**
 * Admin Dashboard Home Component
 * 
 * Provides quick access to product and banner management features.
 */
export default function AdminDashboard({}: Route.ComponentProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10 pt-8 pb-8">
      <div className="w-full max-w-screen-xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-muted-foreground mt-2">
            상품 및 배너를 관리할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
                  <PackageIcon className="text-primary size-6" />
                </div>
                <div>
                  <CardTitle>상품 관리</CardTitle>
                  <CardDescription>
                    상품을 생성, 수정, 삭제할 수 있습니다.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/admin/products/manage">상품 목록</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/products/create">상품 생성</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-12 items-center justify-center rounded-lg">
                  <ImageIcon className="text-primary size-6" />
                </div>
                <div>
                  <CardTitle>배너 관리</CardTitle>
                  <CardDescription>
                    배너를 생성, 수정, 삭제할 수 있습니다.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/admin/banners/manage">배너 목록</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/banners/create">배너 생성</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

