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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.product_id} product={product} />
      ))}
    </div>
  );
}
