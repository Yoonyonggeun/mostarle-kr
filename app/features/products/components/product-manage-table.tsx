/**
 * Product Manage Table Component
 *
 * This component displays a table of products with management actions.
 * It includes image thumbnails, sold out toggle, edit, and delete buttons.
 */
import { EditIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Link, useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
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

interface Product {
  product_id: number;
  title: string;
  price: number;
  width: number | null;
  height: number | null;
  depth: number | null;
  sold_out: boolean;
  first_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductManageTableProps {
  products: Product[];
}

export default function ProductManageTable({
  products,
}: ProductManageTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const toggleFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const handleToggleSoldOut = (productId: number) => {
    const formData = new FormData();
    formData.append("product_id", productId.toString());
    toggleFetcher.submit(formData, {
      method: "POST",
      action: "/api/products/toggle-sold-out",
    });
  };

  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      const formData = new FormData();
      formData.append("product_id", productToDelete.toString());
      deleteFetcher.submit(formData, {
        method: "POST",
        action: "/api/products/delete",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  const formatSize = (
    width: number | null,
    height: number | null,
    depth: number | null,
  ) => {
    const parts: string[] = [];
    if (width) parts.push(`${width}mm`);
    if (height) parts.push(`${height}mm`);
    if (depth) parts.push(`${depth}mm`);
    return parts.length > 0 ? parts.join(" × ") : "-";
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">이미지</TableHead>
            <TableHead>제목</TableHead>
            <TableHead>가격</TableHead>
            <TableHead>크기</TableHead>
            <TableHead className="w-[120px]">Sold out</TableHead>
            <TableHead className="w-[150px]">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground text-center"
              >
                등록된 상품이 없습니다
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow
                key={product.product_id}
                className={cn(product.sold_out && "opacity-60")}
              >
                <TableCell>
                  <div className="relative size-20 overflow-hidden rounded-md border">
                    {product.first_image_url ? (
                      <img
                        src={product.first_image_url}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-full w-full items-center justify-center">
                        <span className="text-muted-foreground text-xs">
                          이미지 없음
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell>
                  {formatSize(product.width, product.height, product.depth)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant={product.sold_out ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleSoldOut(product.product_id)}
                    disabled={toggleFetcher.state === "submitting"}
                  >
                    {product.sold_out ? "품절" : "판매중"}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link to={`/products/edit/${product.product_id}`}>
                        <EditIcon className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(product.product_id)}
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
            <DialogTitle>상품 삭제</DialogTitle>
            <DialogDescription>
              정말 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setProductToDelete(null);
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
