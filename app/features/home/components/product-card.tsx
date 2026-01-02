/**
 * Product Card Component
 *
 * This component displays a single product as a card with thumbnail, title, and price.
 * It supports hover effects and navigation to the product detail page.
 */
import { ImageIcon, Sparkles } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent } from "~/core/components/ui/card";
import { cn } from "~/core/lib/utils";

interface Product {
  product_id: number;
  title: string;
  price: number;
  slug: string;
  first_image_url: string | null;
}

interface ProductCardProps {
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

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block"
      aria-label={`${product.title} 상품 보기`}
    >
      <Card className="from-background to-muted/30 hover:shadow-primary/20 h-full overflow-hidden border-0 bg-gradient-to-br shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
        <CardContent className="p-0">
          {/* Product Image */}
          <div className="from-muted via-muted/50 to-muted/30 relative aspect-square w-full overflow-hidden bg-gradient-to-br">
            {product.first_image_url ? (
              <div className="relative h-full w-full overflow-hidden">
                <img
                  src={product.first_image_url}
                  alt={product.title}
                  className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </div>
            ) : (
              <div className="from-muted to-muted/50 flex h-full items-center justify-center bg-gradient-to-br">
                <ImageIcon className="text-muted-foreground/50 h-12 w-12" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="relative p-5">
            {/* Decorative Accent */}
            <div className="from-primary via-primary/80 absolute top-0 left-0 h-1 w-0 bg-gradient-to-r to-transparent transition-all duration-500 group-hover:w-full" />

            {/* Product Title */}
            <h3
              className="text-foreground group-hover:text-primary mb-3 line-clamp-2 min-h-[3rem] text-lg leading-tight font-bold transition-colors duration-300"
              title={product.title}
            >
              {product.title}
            </h3>

            {/* Product Price with Badge Style */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-primary text-2xl font-extrabold tracking-tight">
                  {formatPrice(product.price)}
                </span>
              </div>
              {/* Hover Indicator */}
              <div className="text-primary flex items-center gap-1 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold">자세히 보기</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
