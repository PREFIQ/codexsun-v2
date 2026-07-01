import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import {
  DESIGN_SYSTEM_DEFAULT_STORAGE_KEY,
  DESIGN_SYSTEM_NAME,
  DESIGN_SYSTEM_VARIANT_MARKER,
  Dashboard01,
  GlobalLoader,
  Toaster,
  isDesignSystemVariantId
} from "@codexsun/ui";
import React from "react";
import { createRoot } from "react-dom/client";
import "@codexsun/ui/styles.css";
import "./styles.css";
import { AdminDesk } from "./pages/AdminDesk";
import { PageTitle } from "./components/PageTitle";
import { HealthPage } from "./pages/HealthPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SaDesk } from "./pages/SaDesk";
import { TenantDesk } from "./pages/TenantDesk";
import { DesignSystemPage } from "./pages/DesignSystemPage";
import { CommonListTemplatePage } from "./pages/templates/CommonListTemplatePage";
import { MasterListTemplatePage } from "./pages/templates/MasterListTemplatePage";
import { EntryListTemplatePage } from "./pages/templates/EntryListTemplatePage";


const rootRoute = createRootRoute();

const homeRoute = createRoute({
  component: HomePage,
  getParentRoute: () => rootRoute,
  path: "/"
});

const healthRoute = createRoute({
  component: HealthPage,
  getParentRoute: () => rootRoute,
  path: "/status"
});

const designSystemRoute = createRoute({
  component: DesignSystemPage,
  getParentRoute: () => rootRoute,
  path: "/design-system"
});

const tenantLoginRoute = createRoute({
  component: () => <LoginPage desk="tenant" title="Tenant Login" />,
  getParentRoute: () => rootRoute,
  path: "/login"
});

const saLoginRoute = createRoute({
  component: () => <LoginPage desk="sa" title="Super Admin Login" />,
  getParentRoute: () => rootRoute,
  path: "/sa/login"
});

const adminLoginRoute = createRoute({
  component: () => <LoginPage desk="admin" title="Staff Admin Login" />,
  getParentRoute: () => rootRoute,
  path: "/admin/login"
});

const saRoute = createRoute({
  component: SaDesk,
  getParentRoute: () => rootRoute,
  path: "/sa"
});

const saModuleRoute = createRoute({
  component: SaDesk,
  getParentRoute: () => rootRoute,
  path: "/sa/$saPage"
});

const adminRoute = createRoute({
  component: AdminDesk,
  getParentRoute: () => rootRoute,
  path: "/admin"
});

const tenantRoute = createRoute({
  component: TenantDesk,
  getParentRoute: () => rootRoute,
  path: "/tenant"
});

const tenantModuleRoute = createRoute({
  component: TenantDesk,
  getParentRoute: () => rootRoute,
  path: "/tenant/$tenantPage"
});

const appRoute = createRoute({
  component: TenantDesk,
  getParentRoute: () => rootRoute,
  path: "/app"
});

const appModuleRoute = createRoute({
  component: TenantDesk,
  getParentRoute: () => rootRoute,
  path: "/app/$tenantPage"
});

const workspaceRoute = createRoute({
  component: import.meta.env.DEV ? Dashboard01 : () => <div>Not Found</div>,
  getParentRoute: () => rootRoute,
  path: "/workspace"
});

const commonListRoute = createRoute({
  component: CommonListTemplatePage,
  getParentRoute: () => rootRoute,
  path: "/design/common-list"
});

const masterListRoute = createRoute({
  component: MasterListTemplatePage,
  getParentRoute: () => rootRoute,
  path: "/design/master-list"
});

const entryListRoute = createRoute({
  component: EntryListTemplatePage,
  getParentRoute: () => rootRoute,
  path: "/design/entry-list"
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  healthRoute,
  designSystemRoute,
  tenantLoginRoute,
  saLoginRoute,
  adminLoginRoute,
  saRoute,
  saModuleRoute,
  adminRoute,
  tenantRoute,
  tenantModuleRoute,
  appRoute,
  appModuleRoute,
  workspaceRoute,
  commonListRoute,
  masterListRoute,
  entryListRoute
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

function GlobalQueryLoader() {
  const fetchingCount = useIsFetching();
  return fetchingCount > 0 ? <GlobalLoader /> : null;
}

const storedDesignVariant = window.localStorage.getItem(DESIGN_SYSTEM_DEFAULT_STORAGE_KEY);
document.documentElement.setAttribute("data-design-system", DESIGN_SYSTEM_NAME);
document.documentElement.setAttribute(
  DESIGN_SYSTEM_VARIANT_MARKER,
  storedDesignVariant && isDesignSystemVariantId(storedDesignVariant)
    ? storedDesignVariant
    : "default"
);

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<GlobalLoader />}>
        <PageTitle />
        <GlobalQueryLoader />
        <RouterProvider router={router} />
        <Toaster />
      </React.Suspense>
    </QueryClientProvider>
  </React.StrictMode>
);
