/**
 * Home Page Component
 *
 * This file implements the main landing page of the application with internationalization support.
 * It demonstrates the use of i18next for multi-language content, React Router's data API for
 * server-side rendering, and responsive design with Tailwind CSS.
 *
 * Key features:
 * - Server-side translation with i18next
 * - Client-side translation with useTranslation hook
 * - SEO-friendly metadata using React Router's meta export
 * - Responsive typography with Tailwind CSS
 */
import type { Route } from "./+types/home";

import { useTranslation } from "react-i18next";

import i18next from "~/core/lib/i18next.server";
import { makePublicClient } from "~/core/lib/supa-client.server";
import { getActiveBanners } from "~/features/banners/lib/queries.server";
import { getAllPublicProducts } from "~/features/products/lib/queries.server";

import { BannerCarousel } from "../components/banner-carousel";
import { ProductList } from "../components/product-list";

/**
 * Meta function for setting page metadata
 *
 * This function generates SEO-friendly metadata for the home page using data from the loader.
 * It sets:
 * - Page title from translated "home.title" key
 * - Meta description from translated "home.subtitle" key
 *
 * The metadata is language-specific based on the user's locale preference.
 *
 * @param data - Data returned from the loader function containing translated title and subtitle
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching
 *
 * This function is executed on the server before rendering the component.
 * It:
 * 1. Extracts the user's locale from the request (via cookies or Accept-Language header)
 * 2. Creates a translation function for that specific locale
 * 3. Fetches active banners and public products in parallel
 * 4. Returns translated strings and data for the page
 *
 * This approach ensures that even on first load, users see content in their preferred language,
 * which improves both user experience and SEO (search engines see localized content).
 *
 * @param request - The incoming HTTP request containing locale information
 * @returns Object with translated title, subtitle, banners, and products
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Get a translation function for the user's locale from the request
  const t = await i18next.getFixedT(request);

  // Create a public client for anonymous data access
  const client = makePublicClient();

  // Fetch banners and products in parallel
  const [banners, products] = await Promise.all([
    getActiveBanners(client).catch((error) => {
      console.error("Error fetching banners:", error);
      return [];
    }),
    getAllPublicProducts(client).catch((error) => {
      console.error("Error fetching products:", error);
      return [];
    }),
  ]);

  // Return translated strings and data for use in both the component and meta function
  return {
    title: t("home.title"),
    subtitle: t("home.subtitle"),
    banners,
    products,
  };
}

/**
 * Home page component
 *
 * This is the main landing page component of the application. It displays:
 * - A banner carousel at the top (if banners are available)
 * - A grid of product cards below the banner
 *
 * Features:
 * - Uses the useTranslation hook for client-side translation
 * - Implements responsive design with Tailwind CSS
 * - Maintains consistent translations between server and client
 * - Displays active banners and public products
 *
 * @returns JSX element representing the home page
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  // Get the translation function for the current locale
  const { t } = useTranslation();
  const { banners = [], products = [] } = loaderData || {};

  return (
    <div className="flex flex-col gap-8">
      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="w-full">
          <BannerCarousel banners={banners} />
        </div>
      )}

      {/* Products Section */}
      <div className="container mx-auto px-4">
        <ProductList products={products} />
      </div>
    </div>
  );
}
