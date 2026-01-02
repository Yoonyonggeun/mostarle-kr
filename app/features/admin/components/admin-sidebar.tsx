import { ImageIcon, LayoutDashboardIcon, PackageIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/core/components/ui/sidebar";

import SidebarMain from "~/features/users/components/sidebar-main";
import SidebarUser from "~/features/users/components/sidebar-user";

const navMain = [
  {
    title: "상품 관리",
    url: "#",
    icon: PackageIcon,
    isActive: false,
    items: [
      {
        title: "상품 목록",
        url: "/admin/products/manage",
      },
      {
        title: "상품 생성",
        url: "/admin/products/create",
      },
    ],
  },
  {
    title: "배너 관리",
    url: "#",
    icon: ImageIcon,
    isActive: false,
    items: [
      {
        title: "배너 목록",
        url: "/admin/banners/manage",
      },
      {
        title: "배너 생성",
        url: "/admin/banners/create",
      },
    ],
  },
];

export default function AdminSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
  };
}) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <LayoutDashboardIcon className="size-5" />
          <span className="font-semibold">관리자 대시보드</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser
          user={{
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

