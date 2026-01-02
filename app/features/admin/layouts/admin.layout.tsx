import type { Route } from "./+types/admin.layout";

import { Outlet } from "react-router";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/core/components/ui/sidebar";
import { requireAdminEmail } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import AdminSidebar from "../components/admin-sidebar";

/**
 * Loader function for admin layout
 * Verifies admin email authorization before rendering the layout
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);

  // Verify admin email authorization
  const user = await requireAdminEmail(client);

  return {
    user: {
      name: user.user_metadata?.name ?? "",
      avatarUrl: user.user_metadata?.avatar_url ?? "",
      email: user.email ?? "",
    },
  };
}

/**
 * Admin Layout Component
 * 
 * Provides a sidebar layout for admin pages with navigation.
 * All routes using this layout require admin email authorization.
 */
export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <SidebarProvider>
      <AdminSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

