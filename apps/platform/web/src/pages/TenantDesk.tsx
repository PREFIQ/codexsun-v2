import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import {
  Building2Icon,
  CalendarDaysIcon,
  ArrowRightIcon,
  BlocksIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MailIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  StoreIcon,
  LockKeyholeIcon,
  UserRoundCogIcon,
  UsersRoundIcon,
} from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { TenantLayout } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { ContactListPage } from "./tenant/ContactListPage";
import { ProductListPage } from "./tenant/ProductListPage";
import { WorkOrderListPage } from "./tenant/WorkOrderListPage";
import { CommonModuleIndexPage, commonModuleGroups } from "./tenant/CommonModuleIndexPage";
import { CommonModulePage } from "./tenant/CommonModulePage";
import { apiGet } from "../api";
import { ApplicationAccountingYearPage, ApplicationCompanyPage, ApplicationDefaultCompanyPage, ApplicationLandingPage, ApplicationPermissionsPage, ApplicationRolesPage, ApplicationSettingsPage, ApplicationUsersPage, readDefaultCompanyBinding, type DefaultCompanyBinding } from "./tenant/ApplicationModules";

type TenantPage =
  | { view: "dashboard" }
  | { view: "billing-overview" }
  | { view: "application"; page: "company" | "default-company" | "accounting-year" | "settings" | "users" | "roles" | "permissions" | "landing" }
  | { view: "entry"; page: "sales" | "purchase" | "receipt" | "payment" }
  | { view: "contacts" }
  | { view: "products" }
  | { view: "work-orders" }
  | { view: "common-index" }
  | { view: "common-module"; definitionKey: string; definitionLabel: string }
  | { view: "generic-module"; definitionKey: string; definitionLabel: string; routePath: string };

const commonModuleLookup = new Map(
  commonModuleGroups.flatMap((group) =>
    group.modules.map((module) => [module.key, module] as const)
  )
);

type TenantMenuModule = {
  children?: TenantMenuModule[];
  description?: string;
  key: string;
  label: string;
  routePath: string;
};

type TenantMenuGroup = {
  icon: typeof StoreIcon;
  key: string;
  label: string;
  modules: TenantMenuModule[];
};

const tenantModuleGroups: TenantMenuGroup[] = [
  {
    key: "foundation",
    label: "Foundation",
    icon: ShieldCheckIcon,
    modules: [
      { key: "users", label: "Users", routePath: "/tenant/foundation/users" },
      { key: "rbac-roles", label: "RBAC Roles", routePath: "/tenant/foundation/rbac-roles" },
      { key: "rbac-policies", label: "RBAC Policies", routePath: "/tenant/foundation/rbac-policies" },
      { key: "rbac-role-policies", label: "RBAC Role Policies", routePath: "/tenant/foundation/rbac-role-policies" },
      { key: "accounting-years", label: "Accounting Years", routePath: "/tenant/foundation/accounting-years" },
      { key: "default-companies", label: "Default Companies", routePath: "/tenant/foundation/default-companies" },
      { key: "address-book", label: "Address Book", routePath: "/tenant/foundation/address-book" },
    ],
  },
  {
    key: "master",
    label: "Master",
    icon: StoreIcon,
    modules: [
      {
        key: "contacts",
        label: "Contacts",
        routePath: "/tenant/master/contacts",
        children: [
          { key: "contact-emails", label: "Contact Emails", routePath: "/tenant/master/contacts/contact-emails" },
          { key: "contact-phones", label: "Contact Phones", routePath: "/tenant/master/contacts/contact-phones" },
          { key: "contact-social-links", label: "Contact Social Links", routePath: "/tenant/master/contacts/contact-social-links" },
          { key: "contact-bank-accounts", label: "Contact Bank Accounts", routePath: "/tenant/master/contacts/contact-bank-accounts" },
          { key: "contact-gst-details", label: "Contact GST Details", routePath: "/tenant/master/contacts/contact-gst-details" },
        ],
      },
      {
        key: "companies",
        label: "Companies",
        routePath: "/tenant/master/companies",
        children: [
          { key: "company-logos", label: "Company Logos", routePath: "/tenant/master/companies/company-logos" },
          { key: "company-emails", label: "Company Emails", routePath: "/tenant/master/companies/company-emails" },
          { key: "company-phones", label: "Company Phones", routePath: "/tenant/master/companies/company-phones" },
          { key: "company-social-links", label: "Company Social Links", routePath: "/tenant/master/companies/company-social-links" },
          { key: "company-bank-accounts", label: "Company Bank Accounts", routePath: "/tenant/master/companies/company-bank-accounts" },
        ],
      },
      {
        key: "products",
        label: "Products",
        routePath: "/tenant/master/products",
        children: [
          { key: "product-groups", label: "Product Groups", routePath: "/tenant/master/products/product-groups" },
          { key: "product-categories", label: "Product Categories", routePath: "/tenant/master/products/product-categories" },
          { key: "product-types", label: "Product Types", routePath: "/tenant/master/products/product-types" },
          { key: "units", label: "Units", routePath: "/tenant/master/products/units" },
          { key: "hsn-codes", label: "HSN Codes", routePath: "/tenant/master/products/hsn-codes" },
          { key: "taxes", label: "Taxes", routePath: "/tenant/master/products/taxes" },
          { key: "brands", label: "Brands", routePath: "/tenant/master/products/brands" },
          { key: "colours", label: "Colours", routePath: "/tenant/master/products/colours" },
          { key: "sizes", label: "Sizes", routePath: "/tenant/master/products/sizes" },
          { key: "styles", label: "Styles", routePath: "/tenant/master/products/styles" },
        ],
      },
      { key: "work-orders", label: "Work Orders", routePath: "/tenant/master/work-orders" },
    ],
  },
  {
    key: "common",
    label: "Common",
    icon: Settings2Icon,
    modules: commonModuleGroups.map((group) => ({
      key: group.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: group.label,
      routePath: group.label === "Location" ? "/tenant/common/locations" : `/tenant/common/${group.modules[0]?.key ?? ""}`,
      children: group.modules.map((module) => ({
        key: module.key,
        label: module.label,
        routePath: group.label === "Location" ? `/tenant/common/locations/${module.key}` : `/tenant/common/${module.key}`,
      })),
    })),
  },
  {
    key: "business",
    label: "Business",
    icon: ReceiptTextIcon,
    modules: [
      { key: "sales", label: "Sales", routePath: "/tenant/billing-entries/sales" },
      { key: "quotations", label: "Quotations", routePath: "/tenant/billing-entries/quotations" },
      { key: "purchases", label: "Purchases", routePath: "/tenant/billing-entries/purchases" },
      { key: "receipts", label: "Receipts", routePath: "/tenant/billing-entries/receipts" },
      { key: "payments", label: "Payments", routePath: "/tenant/billing-entries/payments" },
      { key: "purchase-receipts", label: "Purchase Receipts", routePath: "/tenant/stock/purchase-receipts" },
      { key: "delivery-notes", label: "Delivery Notes", routePath: "/tenant/stock/delivery-notes" },
      { key: "stock-ledger", label: "Stock Ledger", routePath: "/tenant/stock/stock-ledger" },
    ],
  },
  {
    key: "platform-apps",
    label: "Platform Apps",
    icon: BlocksIcon,
    modules: [
      { key: "mail", label: "Mail", routePath: "/tenant/mail/mail" },
      { key: "tasks", label: "Tasks", routePath: "/tenant/task-manager/tasks" },
      { key: "media-assets", label: "Media Assets", routePath: "/tenant/media/media-assets" },
      { key: "site-sliders", label: "Site Sliders", routePath: "/tenant/sites/site-sliders" },
      { key: "blog", label: "Blog", routePath: "/tenant/sites/blog" },
      { key: "company-settings", label: "Company Settings", routePath: "/tenant/settings/company-settings" },
      { key: "document-settings", label: "Document Settings", routePath: "/tenant/settings/document-settings" },
    ],
  },
];

const tenantModulesByPath = new Map<string, TenantMenuModule>();
for (const group of tenantModuleGroups) {
  for (const module of group.modules) {
    tenantModulesByPath.set(module.routePath, module);
    for (const child of module.children ?? []) tenantModulesByPath.set(child.routePath, child);
  }
}

function pageFromUrl(): TenantPage {
  const url = new URL(window.location.href);
  const path = normalizeTenantPath(url.pathname);
  const segments = path.split("/").filter(Boolean);
  const explicitPage = explicitPageFromSegments(segments);
  if (explicitPage) return explicitPage;
  const [, , requestedPage] = path.split("/");
  const requestedPath = path;
  const registryModule = tenantModulesByPath.get(requestedPath);
  if (registryModule) {
    return pageFromRegistryModule(registryModule, requestedPath);
  }
  const [, desk] = url.pathname.split("/");
  if (desk !== "tenant" && desk !== "app") return { view: "dashboard" };

  if (requestedPage === "billing") return { view: "billing-overview" };
  if (requestedPage === "company") return { view: "application", page: "company" };
  if (requestedPage === "default-company") return { view: "application", page: "default-company" };
  if (requestedPage === "accounting-year") return { view: "application", page: "accounting-year" };
  if (requestedPage === "settings") return { view: "application", page: "settings" };
  if (requestedPage === "users") return { view: "application", page: "users" };
  if (requestedPage === "roles") return { view: "application", page: "roles" };
  if (requestedPage === "permissions") return { view: "application", page: "permissions" };
  if (requestedPage === "landing") return { view: "application", page: "landing" };
  if (requestedPage === "sales") return { view: "entry", page: "sales" };
  if (requestedPage === "purchase") return { view: "entry", page: "purchase" };
  if (requestedPage === "receipt") return { view: "entry", page: "receipt" };
  if (requestedPage === "payment") return { view: "entry", page: "payment" };
  if (requestedPage === "contacts") return { view: "contacts" };
  if (requestedPage === "products") return { view: "products" };
  if (requestedPage === "work-orders") return { view: "work-orders" };
  if (requestedPage === "common") return { view: "common-index" };
  if (requestedPage?.startsWith("common-")) {
    const definitionKey = requestedPage.replace(/^common-/, "");
    const definition = commonModuleLookup.get(definitionKey);
    if (definition) {
      return { view: "common-module", definitionKey, definitionLabel: definition.label };
    }
  }
  if (requestedPage) {
    const definition = commonModuleLookup.get(requestedPage);
    if (definition) {
      return { view: "common-module", definitionKey: definition.key, definitionLabel: definition.label };
    }
  }

  return { view: "dashboard" };
}

function explicitPageFromSegments(segments: string[]): TenantPage | null {
  const [desk, group, moduleKey, childKey] = segments;
  if (desk !== "tenant") return null;
  if (!group) return { view: "dashboard" };
  if (group === "foundation") {
    if (moduleKey === "users") return { view: "application", page: "users" };
    if (moduleKey === "rbac-roles") return { view: "application", page: "roles" };
    if (moduleKey === "rbac-policies" || moduleKey === "rbac-role-policies") return { view: "application", page: "permissions" };
    if (moduleKey === "accounting-years") return { view: "application", page: "accounting-year" };
    if (moduleKey === "default-companies") return { view: "application", page: "default-company" };
    if (moduleKey === "address-book") return { view: "common-module", definitionKey: "address-book", definitionLabel: "Address Book" };
    if (moduleKey === "settings") return { view: "application", page: "settings" };
    if (moduleKey === "landing") return { view: "application", page: "landing" };
  }
  if (group === "master") {
    if (moduleKey === "contacts" && !childKey) return { view: "contacts" };
    if (moduleKey === "companies" && !childKey) return { view: "application", page: "company" };
    if (moduleKey === "products" && !childKey) return { view: "products" };
    if (moduleKey === "work-orders") return { view: "work-orders" };
    if (childKey) return { view: "common-module", definitionKey: childKey, definitionLabel: labelFromKey(childKey) };
  }
  if (group === "common") {
    if (moduleKey === "locations" && !childKey) return { view: "common-index" };
    const definitionKey = childKey ?? moduleKey;
    if (definitionKey) return { view: "common-module", definitionKey, definitionLabel: commonModuleLookup.get(definitionKey)?.label ?? labelFromKey(definitionKey) };
  }
  if (moduleKey) return { view: "generic-module", definitionKey: moduleKey, definitionLabel: labelFromKey(moduleKey), routePath: `/${segments.join("/")}` };
  return null;
}

function labelFromKey(key: string) {
  return key.split("-").map((part) => part ? part[0]!.toUpperCase() + part.slice(1) : part).join(" ");
}

function pathForPage(page: TenantPage) {
  if (page.view === "dashboard") return "/tenant";
  if (page.view === "billing-overview") return "/tenant/billing-entries";
  if (page.view === "application") {
    if (page.page === "users") return "/tenant/foundation/users";
    if (page.page === "roles") return "/tenant/foundation/rbac-roles";
    if (page.page === "permissions") return "/tenant/foundation/rbac-policies";
    if (page.page === "default-company") return "/tenant/foundation/default-companies";
    if (page.page === "accounting-year") return "/tenant/foundation/accounting-years";
    if (page.page === "company") return "/tenant/master/companies";
    return `/tenant/foundation/${page.page}`;
  }
  if (page.view === "entry") return `/tenant/billing-entries/${entryRouteKey(page.page)}`;
  if (page.view === "contacts") return "/tenant/master/contacts";
  if (page.view === "products") return "/tenant/master/products";
  if (page.view === "work-orders") return "/tenant/master/work-orders";
  if (page.view === "common-index") return "/tenant/common/locations";
  if (page.view === "common-module") return routeForCommonDefinition(page.definitionKey);
  return page.routePath;
}

function normalizeTenantPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "app") {
    const requestedPage = parts[1] ?? "";
    if (!requestedPage) return "/tenant";
    if (requestedPage === "billing") return "/tenant/billing-entries";
    if (requestedPage === "company") return "/tenant/master/companies";
    if (requestedPage === "default-company") return "/tenant/foundation/default-companies";
    if (requestedPage === "accounting-year") return "/tenant/foundation/accounting-years";
    if (requestedPage === "users") return "/tenant/foundation/users";
    if (requestedPage === "roles") return "/tenant/foundation/rbac-roles";
    if (requestedPage === "permissions") return "/tenant/foundation/rbac-policies";
    if (requestedPage === "settings") return "/tenant/foundation/settings";
    if (requestedPage === "landing") return "/tenant/foundation/landing";
    if (requestedPage === "contacts") return "/tenant/master/contacts";
    if (requestedPage === "products") return "/tenant/master/products";
    if (requestedPage === "work-orders") return "/tenant/master/work-orders";
    const commonDefinition = requestedPage.replace(/^common-/, "");
    if (commonModuleLookup.has(commonDefinition)) return routeForCommonDefinition(commonDefinition);
    return `/tenant/${parts.slice(1).join("/")}`;
  }
  return `/${parts.join("/")}`;
}

function pageFromRegistryModule(module: TenantMenuModule, routePath: string): TenantPage {
  if (routePath === "/tenant/foundation/users") return { view: "application", page: "users" };
  if (routePath === "/tenant/foundation/rbac-roles") return { view: "application", page: "roles" };
  if (routePath === "/tenant/foundation/rbac-policies" || routePath === "/tenant/foundation/rbac-role-policies") return { view: "application", page: "permissions" };
  if (routePath === "/tenant/foundation/default-companies") return { view: "application", page: "default-company" };
  if (routePath === "/tenant/foundation/accounting-years") return { view: "application", page: "accounting-year" };
  if (routePath === "/tenant/master/companies") return { view: "application", page: "company" };
  if (routePath === "/tenant/master/contacts") return { view: "contacts" };
  if (routePath === "/tenant/master/products") return { view: "products" };
  if (routePath === "/tenant/master/work-orders") return { view: "work-orders" };
  if (routePath === "/tenant/common/locations") return { view: "common-index" };
  if (routePath.startsWith("/tenant/common/")) return { view: "common-module", definitionKey: module.key, definitionLabel: module.label };
  if (routePath.startsWith("/tenant/master/") || routePath.startsWith("/tenant/foundation/")) {
    return { view: "common-module", definitionKey: module.key, definitionLabel: module.label };
  }
  return { view: "generic-module", definitionKey: module.key, definitionLabel: module.label, routePath };
}

function routeForCommonDefinition(definitionKey: string) {
  return ["countries", "states", "districts", "cities", "pincodes", "destinations"].includes(definitionKey)
    ? `/tenant/common/locations/${definitionKey}`
    : `/tenant/common/${definitionKey}`;
}

function entryRouteKey(page: "sales" | "purchase" | "receipt" | "payment") {
  if (page === "purchase") return "purchases";
  if (page === "receipt") return "receipts";
  if (page === "payment") return "payments";
  return "sales";
}

function isModuleActive(page: TenantPage, module: TenantMenuModule): boolean {
  const currentPath = pathForPage(page);
  return currentPath === module.routePath || currentPath.startsWith(`${module.routePath}/`) || Boolean(module.children?.some((child) => isModuleActive(page, child)));
}

export function TenantDesk() {
  const [, setPageState] = useState<TenantPage>(() => pageFromUrl());
  const [defaultBinding, setDefaultBinding] = useState<DefaultCompanyBinding>(() => readDefaultCompanyBinding());
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const companiesQuery = useQuery({
    queryKey: ["tenant", "companies", "brand"],
    queryFn: () => apiGet<Array<{ companyId: string; legalName: string; tradeName?: string }>>("/core/companies", "tenant"),
  });
  const page = pageFromUrl();

  function selectPage(nextPage: TenantPage, historyMode: "push" | "replace" = "push") {
    const url = new URL(window.location.href);
    url.pathname = pathForPage(nextPage);
    window.history[historyMode === "replace" ? "replaceState" : "pushState"]({ page: nextPage }, "", url);
    setPageState(nextPage);
  }

  useEffect(() => {
    selectPage(page, "replace");
    const handlePopState = () => setPageState(pageFromUrl());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    setPageState(pageFromUrl());
  }, [pathname]);

  useEffect(() => {
    const handleDefaultCompanyUpdated = (event: Event) => {
      const detail = (event as CustomEvent<DefaultCompanyBinding>).detail;
      setDefaultBinding(detail ?? readDefaultCompanyBinding());
    };
    window.addEventListener("codexsun-default-company-updated", handleDefaultCompanyUpdated);
    return () => window.removeEventListener("codexsun-default-company-updated", handleDefaultCompanyUpdated);
  }, []);

  const menuItems = useMemo(() => {
    return [
      {
        title: "Overview",
        icon: LayoutDashboardIcon,
        isActive: page.view === "dashboard" || page.view === "billing-overview",
        onSelect: () => selectPage({ view: "dashboard" })
      },
      ...tenantModuleGroups.map((group) => ({
        title: group.label,
        icon: group.icon,
        isActive: group.modules.some((module) => isModuleActive(page, module)),
        items: group.modules.map((module) => ({
          title: module.label,
          isActive: isModuleActive(page, module),
          onSelect: () => selectPage(pageFromRegistryModule(module, module.routePath)),
          ...(module.children?.length ? { items: module.children.map((child) => ({
            title: child.label,
            isActive: isModuleActive(page, child),
            onSelect: () => selectPage(pageFromRegistryModule(child, child.routePath))
          })) } : {})
        }))
      })),
    ];
  }, [page]);

  const workspaceItems = useMemo(() => {
    const currentPath = pathForPage(page);
    return tenantModuleGroups.map((group) => ({
          title: group.label,
          description: `${group.modules.length} tenant modules`,
          icon: group.icon,
          active: currentPath.includes(`/tenant/${group.key}`) || group.modules.some((module) => isModuleActive(page, module)),
          url: group.modules[0]?.routePath ?? "/tenant"
    }));
  }, [page]);

  function renderPage() {
    switch (page.view) {
      case "dashboard":
        return (
          <DeskOverview
            badge="Signed in as ADMIN"
            icon={BlocksIcon}
            kicker="Application"
            tone="application"
            title="Application Desk"
            description="Shared workspace, company setup, roles, and cross-app launch desk."
            stats={[
              { label: "Companies", value: "1", page: { view: "application", page: "company" } },
              { label: "Default Company", value: "1", page: { view: "application", page: "default-company" } },
              { label: "Accounting Years", value: "1", page: { view: "application", page: "accounting-year" } },
              { label: "Users", value: "1", page: { view: "application", page: "users" } },
              { label: "Roles", value: "3", page: { view: "application", page: "roles" } },
              { label: "Permissions", value: "9", page: { view: "application", page: "permissions" } },
              { label: "Settings", value: "Ready", page: { view: "application", page: "settings" } },
            ]}
            links={[
              { label: "Company", page: { view: "application", page: "company" } },
              { label: "Default Company", page: { view: "application", page: "default-company" } },
              { label: "Accounting Year", page: { view: "application", page: "accounting-year" } },
              { label: "Settings", page: { view: "application", page: "settings" } },
              { label: "Users", page: { view: "application", page: "users" } },
              { label: "Roles", page: { view: "application", page: "roles" } },
              { label: "Permissions", page: { view: "application", page: "permissions" } },
              { label: "Landing Desk", page: { view: "application", page: "landing" } },
            ]}
            onNavigate={selectPage}
          />
        );
      case "billing-overview":
        return (
          <DeskOverview
            badge="Signed in as ADMIN"
            icon={ReceiptTextIcon}
            kicker="Billing"
            tone="billing"
            title="Billing Desk"
            description="Sales, purchase, receipt, payment, report, master, common, and billing settings."
            stats={[
              { label: "Entries", value: "4", page: { view: "entry", page: "sales" } },
              { label: "Masters", value: "2", page: { view: "contacts" } },
              { label: "Common Modules", value: "30", page: { view: "common-index" } },
              { label: "Sales", value: "Ready", page: { view: "entry", page: "sales" } },
              { label: "Purchase", value: "Ready", page: { view: "entry", page: "purchase" } },
              { label: "Payments", value: "Ready", page: { view: "entry", page: "payment" } },
            ]}
            links={[
              { label: "Sales", page: { view: "entry", page: "sales" } },
              { label: "Purchase", page: { view: "entry", page: "purchase" } },
              { label: "Receipt", page: { view: "entry", page: "receipt" } },
              { label: "Payment", page: { view: "entry", page: "payment" } },
              { label: "Contact Master", page: { view: "contacts" } },
              { label: "Product Master", page: { view: "products" } },
              { label: "Common Setup", page: { view: "common-index" } },
            ]}
            onNavigate={selectPage}
          />
        );
      case "contacts":
        return <ContactListPage onBack={() => selectPage({ view: "dashboard" })} />;
      case "products":
        return <ProductListPage onBack={() => selectPage({ view: "dashboard" })} />;
      case "work-orders":
        return <WorkOrderListPage onBack={() => selectPage({ view: "dashboard" })} />;
      case "application":
        if (page.page === "company") return <ApplicationCompanyPage onBack={() => selectPage({ view: "dashboard" })} />;
        if (page.page === "default-company") return <ApplicationDefaultCompanyPage onBack={() => selectPage({ view: "dashboard" })} />;
        if (page.page === "accounting-year") return <ApplicationAccountingYearPage onBack={() => selectPage({ view: "dashboard" })} />;
        if (page.page === "users") return <ApplicationUsersPage onBack={() => selectPage({ view: "dashboard" })} />;
        if (page.page === "roles") return <ApplicationRolesPage onBack={() => selectPage({ view: "dashboard" })} />;
        if (page.page === "permissions") return <ApplicationPermissionsPage onBack={() => selectPage({ view: "dashboard" })} />;
        if (page.page === "settings") return <ApplicationSettingsPage onBack={() => selectPage({ view: "dashboard" })} />;
        if (page.page === "landing") return <ApplicationLandingPage onBack={() => selectPage({ view: "dashboard" })} />;
        return null;
      case "entry":
        return <ApplicationPlaceholder page={page.page} />;
      case "common-index":
        return (
          <CommonModuleIndexPage
            onNavigate={(key, label) => selectPage({ view: "common-module", definitionKey: key, definitionLabel: label })}
          />
        );
      case "common-module":
        return (
          <CommonModulePage
            definitionKey={page.definitionKey}
            definitionLabel={page.definitionLabel}
          />
        );
      case "generic-module":
        return (
          <CommonModulePage
            definitionKey={page.definitionKey}
            definitionLabel={page.definitionLabel}
          />
        );
      default:
        return null;
    }
  }

  return (
    <AuthGate desk="tenant">
      <TenantLayout
        brand={{
          href: "/app/default-company",
          subtitle: brandSubtitle(defaultBinding),
          title: brandTitle(defaultBinding, companiesQuery.data ?? []),
        }}
        headerTitle={headerTitleForPage(page)}
        menuItems={menuItems}
        subtitle={null}
        title={null}
        workspaceItems={workspaceItems}
      >
        {renderPage()}
      </TenantLayout>
    </AuthGate>
  );
}

type OverviewTarget = TenantPage;

type OverviewMetric = {
  label: string;
  page: OverviewTarget;
  value: string;
};

type OverviewLink = {
  label: string;
  page: OverviewTarget;
};

function DeskOverview({
  badge,
  description,
  icon: Icon,
  kicker,
  links,
  onNavigate,
  stats,
  title,
  tone,
}: {
  badge: string;
  description: string;
  icon: typeof StoreIcon;
  kicker: string;
  links: OverviewLink[];
  onNavigate: (page: TenantPage) => void;
  stats: OverviewMetric[];
  title: string;
  tone: "application" | "billing";
}) {
  const toneClass = tone === "billing"
    ? "from-emerald-50 via-background to-emerald-100/80"
    : "from-background via-slate-50 to-slate-200/95";
  const cornerClass = tone === "billing"
    ? "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),rgba(209,250,229,0.12)_34%,transparent_62%)]"
    : "bg-[radial-gradient(circle_at_top_right,rgba(100,116,139,0.24),rgba(203,213,225,0.26)_36%,transparent_66%)]";
  const iconClass = tone === "billing" ? "bg-emerald-600 text-white" : "bg-slate-950 text-white";

  return (
    <section className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-6 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
      <div className={`relative overflow-hidden rounded-md border border-border/70 bg-gradient-to-r ${toneClass} shadow-sm`}>
        <div className={`pointer-events-none absolute inset-0 ${cornerClass}`} />
        <div className="relative flex min-h-[136px] flex-col justify-between gap-5 px-5 py-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex size-14 shrink-0 items-center justify-center rounded-md shadow-sm ${iconClass}`}>
              <Icon className="size-7 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-normal text-foreground">{kicker}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-none tracking-normal text-foreground">{title}</h1>
              <p className="mt-4 max-w-4xl text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit shrink-0 gap-2 rounded-full bg-background/95 px-4 py-2 text-foreground shadow-sm">
            <UsersRoundIcon className="size-4" />
            <span className="normal-case">{badge}</span>
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => onNavigate(stat.page)}
            className="rounded-md border border-border/70 bg-card/95 p-5 text-left shadow-sm transition-colors hover:bg-muted/30"
          >
            <div className="text-3xl font-semibold tabular-nums text-foreground">{stat.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {links.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={() => onNavigate(link.page)}
            className="flex items-center justify-between rounded-md border border-border/70 bg-card/95 px-4 py-3 text-sm shadow-sm transition-colors hover:bg-muted/30"
          >
            <span>{link.label}</span>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  );
}

function headerTitleForPage(page: TenantPage) {
  if (page.view === "dashboard" || page.view === "billing-overview") return "Overview";
  if (page.view === "application") return placeholderMeta[page.page].title;
  if (page.view === "entry") return placeholderMeta[page.page].title;
  if (page.view === "contacts") return "Contact";
  if (page.view === "products") return "Product";
  if (page.view === "work-orders") return "Work Orders";
  if (page.view === "common-index") return "Common";
  if (page.view === "common-module") return page.definitionLabel;
  if (page.view === "generic-module") return page.definitionLabel;
  return "Overview";
}

function brandTitle(binding: DefaultCompanyBinding, companies: Array<{ companyId: string; legalName: string; tradeName?: string }>) {
  const selected = companies.find((company) => company.companyId === binding.companyId);
  return selected?.tradeName || selected?.legalName || binding.companyName || "Select Company";
}

function brandSubtitle(binding: DefaultCompanyBinding) {
  return binding.accountingYearName || "Select accounting year";
}

const placeholderMeta = {
  company: { title: "Company", description: "Manage company identity, address, and registration details.", icon: Building2Icon },
  "default-company": { title: "Default Company", description: "Choose the default company used by the application desk.", icon: Building2Icon },
  "accounting-year": { title: "Accounting Year", description: "Open, close, and switch active accounting years.", icon: CalendarDaysIcon },
  settings: { title: "Settings", description: "Application-level billing and workspace settings.", icon: Settings2Icon },
  users: { title: "Users", description: "Manage application users and desk access.", icon: UsersRoundIcon },
  roles: { title: "Roles", description: "Manage application roles and permissions.", icon: ShieldCheckIcon },
  permissions: { title: "Permissions", description: "Review permission boundaries used by application roles.", icon: LockKeyholeIcon },
  landing: { title: "Landing Desk", description: "Application desk landing and quick access area.", icon: UserRoundCogIcon },
  sales: { title: "Sales", description: "Sales billing entries will open here.", icon: FileTextIcon },
  purchase: { title: "Purchase", description: "Purchase entries will open here.", icon: FileTextIcon },
  receipt: { title: "Receipt", description: "Receipt entries will open here.", icon: ReceiptTextIcon },
  payment: { title: "Payment", description: "Payment entries will open here.", icon: ReceiptTextIcon },
} as const;

function ApplicationPlaceholder({ page }: { page: keyof typeof placeholderMeta }) {
  const meta = placeholderMeta[page];
  const Icon = meta.icon;

  return (
    <section className="mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-4 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
      <div className="rounded-md border border-border/70 bg-card/95 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-md border border-border/70 bg-background">
            <Icon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="mb-1 text-lg font-semibold">{meta.title}</h2>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
