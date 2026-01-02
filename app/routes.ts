/**
 * Application Routes Configuration
 *
 * This file defines all routes for the application using React Router's
 * file-based routing system. Routes are organized by feature and access level.
 *
 * The structure uses layouts for shared UI elements and prefixes for route grouping.
 * This approach creates a hierarchical routing system that's both maintainable and scalable.
 */
import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  route("/robots.txt", "core/screens/robots.ts"),
  route("/sitemap.xml", "core/screens/sitemap.ts"),
  ...prefix("/debug", [
    // You should delete this in production.
    route("/sentry", "debug/sentry.tsx"),
    route("/analytics", "debug/analytics.tsx"),
  ]),
  // API Routes. Routes that export actions and loaders but no UI.
  ...prefix("/api", [
    ...prefix("/settings", [
      route("/theme", "features/settings/api/set-theme.tsx"),
      route("/locale", "features/settings/api/set-locale.tsx"),
    ]),
    ...prefix("/users", [
      index("features/users/api/delete-account.tsx"),
      route("/password", "features/users/api/change-password.tsx"),
      route("/email", "features/users/api/change-email.tsx"),
      route("/profile", "features/users/api/edit-profile.tsx"),
      route("/providers", "features/users/api/connect-provider.tsx"),
      route(
        "/providers/:provider",
        "features/users/api/disconnect-provider.tsx",
      ),
    ]),
    ...prefix("/products", [
      route("/create", "features/products/api/create.tsx"),
      route("/update", "features/products/api/update.tsx"),
      route("/delete", "features/products/api/delete.tsx"),
      route("/toggle-sold-out", "features/products/api/toggle-sold-out.tsx"),
    ]),
    ...prefix("/banners", [
      route("/create", "features/banners/api/create.tsx"),
      route("/update", "features/banners/api/update.tsx"),
      route("/delete", "features/banners/api/delete.tsx"),
    ]),
    ...prefix("/cron", [route("/mailer", "features/cron/api/mailer.tsx")]),
  ]),

  layout("core/layouts/navigation.layout.tsx", [
    route("/auth/confirm", "features/auth/screens/confirm.tsx"),
    index("features/home/screens/home.tsx"),
    route("/products/:slug", "features/products/screens/detail.tsx"),
    route("/error", "core/screens/error.tsx"),
    layout("core/layouts/public.layout.tsx", [
      // Routes that should only be visible to unauthenticated users.
      route("/login", "features/auth/screens/login.tsx"),
      route("/join", "features/auth/screens/join.tsx"),
      ...prefix("/auth", [
        ...prefix("/social", [
          route("/start/:provider", "features/auth/screens/social/start.tsx"),
          route(
            "/complete/:provider",
            "features/auth/screens/social/complete.tsx",
          ),
        ]),
      ]),
    ]),
    layout("core/layouts/private.layout.tsx", { id: "private-auth" }, [
      // Routes that should only be visible to authenticated users.
      route("/logout", "features/auth/screens/logout.tsx"),
    ]),
    ...prefix("/payments", [
      route("/checkout", "features/payments/screens/checkout.tsx"),
      layout("core/layouts/private.layout.tsx", { id: "private-payments" }, [
        route("/success", "features/payments/screens/success.tsx"),
        route("/failure", "features/payments/screens/failure.tsx"),
      ]),
    ]),
  ]),

  layout("core/layouts/private.layout.tsx", { id: "private-dashboard" }, [
    layout("features/users/layouts/dashboard.layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/screens/dashboard.tsx"),
        route("/payments", "features/payments/screens/payments.tsx"),
      ]),
      route("/account/edit", "features/users/screens/account.tsx"),
    ]),
  ]),

  // Admin routes with sidebar layout
  layout("core/layouts/private.layout.tsx", { id: "private-admin" }, [
    layout("features/admin/layouts/admin.layout.tsx", [
      ...prefix("/admin", [
        index("features/admin/screens/index.tsx"),
        // Product management (moved from /products/*)
        ...prefix("/products", [
          route("/manage", "features/products/screens/manage.tsx"),
          route("/create", "features/products/screens/create.tsx"),
          route("/edit/:id", "features/products/screens/edit.tsx"),
        ]),
        // Banner management
        ...prefix("/banners", [
          route("/manage", "features/banners/screens/manage.tsx"),
          route("/create", "features/banners/screens/create.tsx"),
          route("/edit/:id", "features/banners/screens/edit.tsx"),
        ]),
      ]),
    ]),
  ]),

  ...prefix("/legal", [route("/:slug", "features/legal/screens/policy.tsx")]),
] satisfies RouteConfig;
