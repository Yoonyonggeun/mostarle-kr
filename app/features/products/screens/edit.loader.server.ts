import { eq } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import { requireAdminEmail } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

import { productDetails, productImages, products } from "../schema";

/**
 * Loader function for fetching product data
 */
export async function editLoader(request: Request, productId: number) {
  const [client] = makeServerClient(request);

  // Verify admin email authorization
  const user = await requireAdminEmail(client);

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


