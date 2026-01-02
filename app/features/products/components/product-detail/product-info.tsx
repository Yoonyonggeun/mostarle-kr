/**
 * Product Info Component
 *
 * This component displays product information including:
 * - Product title
 * - Price (formatted as KRW)
 * - Sold out status badge
 * - Quantity selector
 * - Add to cart button (disabled for now - cart feature needed)
 * - Buy now button (links to checkout)
 * - Shipping/return information
 */
import { Link } from "react-router";
import { useState } from "react";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";

interface Product {
  product_id: number;
  title: string;
  price: number;
  slug: string;
  sold_out: boolean;
}

interface ProductInfoProps {
  product: Product;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    // For now, show a message
    alert("장바구니 기능은 곧 추가될 예정입니다.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Product Title */}
      <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
        {product.title}
      </h1>

      {/* Price and Sold Out Status */}
      <div className="flex items-center gap-4">
        <span className="text-primary text-4xl font-extrabold tracking-tight">
          {formatPrice(product.price)}
        </span>
        {product.sold_out && (
          <Badge variant="destructive" className="text-sm">
            품절
          </Badge>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity">수량</Label>
        <div className="flex items-center gap-2">
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-24"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleAddToCart}
          disabled={product.sold_out}
          className="flex-1"
        >
          장바구니에 추가
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={product.sold_out}
          className="flex-1"
          asChild
        >
          <Link to="/payments/checkout">바로 구매</Link>
        </Button>
      </div>

      {/* Shipping/Return Information */}
      <div className="border-t pt-6">
        <h2 className="mb-4 text-lg font-semibold">배송/반품 정보</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• 배송비: 무료</p>
          <p>• 배송 기간: 2-3일 소요</p>
          <p>• 반품/교환: 배송 완료 후 7일 이내 가능</p>
        </div>
      </div>
    </div>
  );
}

