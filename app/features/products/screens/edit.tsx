/**
 * Edit Product Page
 *
 * This page allows editing an existing product.
 * It loads the product data and displays the form with initial values.
 */
import type { Route } from "./+types/edit";

import CreateProductForm from "../components/forms/create-product-form";
import { editLoader } from "./edit.loader.server";

/**
 * Meta function for setting page metadata
 */
export const meta: Route.MetaFunction = () => {
  return [{ title: `상품 수정 | ${import.meta.env.VITE_APP_NAME}` }];
};

/**
 * Loader function for fetching product data
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  // Get product ID from params
  const productId = parseInt(params.id || "", 10);
  if (isNaN(productId)) {
    throw new Response("유효하지 않은 상품 ID입니다", { status: 400 });
  }

  return editLoader(request, productId);
}

/**
 * Edit Product component
 */
export default function Edit({ loaderData }: Route.ComponentProps) {
  const { product, images, details } = loaderData;

  return (
    <div className="flex w-full flex-col items-center gap-10 pt-0 pb-8">
      <CreateProductForm
        initialData={{
          product: {
            product_id: product.product_id,
            title: product.title,
            price: product.price,
            difficulty: product.difficulty,
            working_time: product.working_time,
            width: product.width,
            height: product.height,
            depth: product.depth,
            slug: product.slug,
            sold_out: product.sold_out,
          },
          images: images.map((img) => ({
            image_id: img.image_id,
            image_url: img.image_url,
            image_order: img.image_order,
          })),
          details: details.map((detail) => ({
            detail_id: detail.detail_id,
            detail_title: detail.detail_title,
            detail_description: detail.detail_description,
            detail_image_url: detail.detail_image_url,
            detail_order: detail.detail_order,
          })),
        }}
        actionUrl="/api/products/update"
        mode="edit"
      />
    </div>
  );
}
