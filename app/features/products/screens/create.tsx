import type { Route } from "./+types/create";

import makeServerClient from "~/core/lib/supa-client.server";
import { requireAdminEmail } from "~/core/lib/guards.server";

import CreateProductForm from "../components/forms/create-product-form";

export const meta: Route.MetaFunction = () => {
  return [{ title: `상품 생성 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  
  // Verify admin email authorization
  await requireAdminEmail(client);
  
  return {};
}

export default function CreateProduct({}: Route.ComponentProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10 pt-0 pb-8">
      <CreateProductForm />
    </div>
  );
}

