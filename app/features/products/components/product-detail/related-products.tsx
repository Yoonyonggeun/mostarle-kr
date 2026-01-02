/**
 * Related Products Component
 *
 * This component displays a section of related/recommended products.
 * It reuses the ProductCard component from the home page.
 */
import { ProductCard } from "~/features/home/components/product-card";

interface Product {
  product_id: number;
  title: string;
  price: number;
  slug: string;
  first_image_url: string | null;
}

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 border-t pt-8">
      <h2 className="text-2xl font-bold">추천 상품</h2>
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
    </div>
  );
}

