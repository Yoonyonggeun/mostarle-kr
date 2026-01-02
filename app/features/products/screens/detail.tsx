/**
 * Product Detail Page Component
 *
 * This file implements the product detail page that displays comprehensive
 * product information including images, details, and related products.
 *
 * Key features:
 * - Server-side data fetching with loader
 * - SEO-friendly metadata
 * - Responsive layout
 * - Image gallery with thumbnails
 * - Product information and purchase options
 * - Product details sections
 * - Related products recommendations
 */
import type { Route } from "./+types/detail";

import { data } from "react-router";

import { makePublicClient } from "~/core/lib/supa-client.server";
import {
  getAllPublicProducts,
  getProductBySlug,
} from "~/features/products/lib/queries.server";

import { ProductDetails } from "../components/product-detail/product-details";
import { ProductGallery } from "../components/product-detail/product-gallery";
import { ProductInfo } from "../components/product-detail/product-info";
import { RelatedProducts } from "../components/product-detail/related-products";

/**
 * Meta function for setting page metadata
 *
 * This function generates SEO-friendly metadata for the product detail page.
 * It sets:
 * - Page title with product name
 * - Meta description
 * - Open Graph tags for social sharing
 *
 * @param data - Data returned from the loader function containing product information
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  if (!data?.product) {
    return [
      {
        title: `Product Not Found | ${import.meta.env.VITE_APP_NAME}`,
      },
    ];
  }

  const { product } = data;
  const firstImage =
    product.product_images && product.product_images.length > 0
      ? product.product_images[0].image_url
      : null;

  return [
    {
      title: `${product.title} | ${import.meta.env.VITE_APP_NAME}`,
    },
    {
      name: "description",
      content: product.title,
    },
    {
      property: "og:title",
      content: product.title,
    },
    {
      property: "og:description",
      content: product.title,
    },
    ...(firstImage
      ? [
          {
            property: "og:image",
            content: firstImage,
          },
        ]
      : []),
  ];
};

/**
 * Loader function for server-side data fetching
 *
 * This function fetches:
 * 1. The product by slug with all images and details
 * 2. All public products for related products selection
 *
 * Error handling:
 * - Returns 404 if product not found
 *
 * @param params - URL parameters containing the product slug
 * @returns Object with product data and related products
 */
export async function loader({ params }: Route.LoaderArgs) {
  const client = makePublicClient();

  // Fetch product by slug
  const product = await getProductBySlug(client, params.slug || "");

  if (!product) {
    throw data(null, { status: 404 });
  }

  // Fetch all public products for related products
  const allProducts = await getAllPublicProducts(client).catch((error) => {
    console.error("Error fetching products for related products:", error);
    return [];
  });

  // Get 4 random products excluding the current product
  const relatedProducts = allProducts
    .filter((p) => p.product_id !== product.product_id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return {
    product,
    relatedProducts,
  };
}

/**
 * Product detail page component
 *
 * This component displays:
 * 1. Product gallery and information (top section)
 * 2. Product details sections (middle section)
 * 3. Related products (bottom section)
 *
 * @param loaderData - Data from the loader containing product and related products
 * @returns JSX element representing the product detail page
 */
export default function Detail({ loaderData }: Route.ComponentProps) {
  const { product, relatedProducts } = loaderData;

  if (!product) {
    return null;
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Top Section: Product Gallery and Info */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={product.product_images || []} />
        <ProductInfo product={product} />
      </div>

      {/* Middle Section: Product Details */}
      {product.product_details && product.product_details.length > 0 && (
        <ProductDetails details={product.product_details} />
      )}

      {/* Bottom Section: Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}
    </div>
  );
}

