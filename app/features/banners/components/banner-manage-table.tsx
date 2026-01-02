/**
 * Banner Manage Table Component
 *
 * This component displays a table of banners with management actions.
 * It includes image thumbnails, active status, display order, edit, and delete buttons.
 */
import { EditIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Link, useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Badge } from "~/core/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/core/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import { cn } from "~/core/lib/utils";

interface Banner {
  banner_id: number;
  image_url_mobile: string;
  image_url_desktop: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BannerManageTableProps {
  banners: Banner[];
}

export default function BannerManageTable({
  banners,
}: BannerManageTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const deleteFetcher = useFetcher();

  const handleDeleteClick = (bannerId: number) => {
    setBannerToDelete(bannerId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (bannerToDelete) {
      const formData = new FormData();
      formData.append("banner_id", bannerToDelete.toString());
      deleteFetcher.submit(formData, {
        method: "POST",
        action: "/api/banners/delete",
      });
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">이미지</TableHead>
            <TableHead className="w-[200px]">링크 URL</TableHead>
            <TableHead className="w-[100px]">순서</TableHead>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="w-[150px]">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground text-center"
              >
                등록된 배너가 없습니다
              </TableCell>
            </TableRow>
          ) : (
            banners.map((banner) => (
              <TableRow
                key={banner.banner_id}
                className={cn(!banner.is_active && "opacity-60")}
              >
                <TableCell>
                  <div className="flex gap-2">
                    <div className="relative size-20 overflow-hidden rounded-md border">
                      {banner.image_url_mobile ? (
                        <img
                          src={banner.image_url_mobile}
                          alt="모바일 배너"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-full w-full items-center justify-center">
                          <span className="text-muted-foreground text-xs">
                            모바일
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="relative size-20 overflow-hidden rounded-md border">
                      {banner.image_url_desktop ? (
                        <img
                          src={banner.image_url_desktop}
                          alt="PC 배너"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-full w-full items-center justify-center">
                          <span className="text-muted-foreground text-xs">
                            PC
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {banner.link_url ? (
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      {banner.link_url.length > 30
                        ? `${banner.link_url.substring(0, 30)}...`
                        : banner.link_url}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>{banner.display_order}</TableCell>
                <TableCell>
                  <Badge variant={banner.is_active ? "default" : "secondary"}>
                    {banner.is_active ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link to={`/admin/banners/edit/${banner.banner_id}`}>
                        <EditIcon className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(banner.banner_id)}
                      disabled={deleteFetcher.state === "submitting"}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배너 삭제</DialogTitle>
            <DialogDescription>
              정말 이 배너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setBannerToDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteFetcher.state === "submitting"}
            >
              {deleteFetcher.state === "submitting" ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

