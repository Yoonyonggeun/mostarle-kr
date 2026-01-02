/**
 * Product List Component
 *
 * This component displays a grid layout of product cards.
 * It handles empty states and responsive grid columns.
 */
import { ProductCard } from "./product-card";

interface Product {
  product_id: number;
  title: string;
  price: number;
  slug: string;
  first_image_url: string | null;
}

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">
            표시할 상품이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4 [-webkit-overflow-scrolling:touch] lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-x-visible lg:pb-0">
      {products.map((product) => (
        <div
          key={product.product_id}
          className="w-[240px] flex-shrink-0 lg:w-auto"
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
