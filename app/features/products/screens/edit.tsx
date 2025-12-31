/**
 * Edit Product Page
 *
 * This page allows editing an existing product.
 * It loads the product data and displays the form with initial values.
 */
import type { Route } from "./+types/edit";

import { eq } from "drizzle-orm";

import CreateProductForm from "../components/forms/create-product-form";
import db from "~/core/db/drizzle-client.server";
import { requireAdminEmail } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { productDetails, productImages, products } from "../schema";

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
  const [client] = makeServerClient(request);

  // Verify admin email authorization
  const user = await requireAdminEmail(client);

  // Get product ID from params
  const productId = parseInt(params.id || "", 10);
  if (isNaN(productId)) {
    throw new Response("유효하지 않은 상품 ID입니다", { status: 400 });
  }

  // Get product
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.product_id, productId))
    .limit(1);

  if (!product) {
    throw new Response("상품을 찾을 수 없습니다", { status: 404 });
  }

  // Verify ownership
  if (product.created_by !== user.id) {
    throw new Response("권한이 없습니다", { status: 403 });
  }

  // Get product images
  const imagesList = await db
    .select()
    .from(productImages)
    .where(eq(productImages.product_id, productId));
  const images = imagesList.sort((a, b) => a.image_order - b.image_order);

  // Get product details
  const detailsList = await db
    .select()
    .from(productDetails)
    .where(eq(productDetails.product_id, productId));
  const details = detailsList.sort((a, b) => a.detail_order - b.detail_order);

  return {
    product,
    images,
    details,
  };
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

