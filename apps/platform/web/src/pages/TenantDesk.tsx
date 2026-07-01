import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  | { view: "common-index" }
  | { view: "common-module"; definitionKey: string; definitionLabel: string };

const commonModuleLookup = new Map(
  commonModuleGroups.flatMap((group) =>
    group.modules.map((module) => [module.key, module] as const)
  )
);

function pageFromUrl(): TenantPage {
  const url = new URL(window.location.href);
  const [, desk, requestedPage] = url.pathname.split("/");
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

function pathForPage(page: TenantPage) {
  if (page.view === "dashboard") return "/app";
  if (page.view === "billing-overview") return "/app/billing";
  if (page.view === "application") return `/app/${page.page}`;
  if (page.view === "entry") return `/app/${page.page}`;
  if (page.view === "common-index") return "/app/common";
  if (page.view === "common-module" && page.definitionKey === "accounting-year") return "/app/common-accounting-year";
  if (page.view === "common-module") return `/app/${page.definitionKey}`;
  return `/app/${page.view}`;
}

export function TenantDesk() {
  const [page, setPage] = useState<TenantPage>(() => pageFromUrl());
  const [defaultBinding, setDefaultBinding] = useState<DefaultCompanyBinding>(() => readDefaultCompanyBinding());
  const companiesQuery = useQuery({
    queryKey: ["tenant", "companies", "brand"],
    queryFn: () => apiGet<Array<{ companyId: string; legalName: string; tradeName?: string }>>("/core/companies", "tenant"),
  });

  function selectPage(nextPage: TenantPage, historyMode: "push" | "replace" = "push") {
    setPage(nextPage);
    const url = new URL(window.location.href);
    url.pathname = pathForPage(nextPage);
    window.history[historyMode === "replace" ? "replaceState" : "pushState"]({ page: nextPage }, "", url);
  }

  useEffect(() => {
    selectPage(page, "replace");
    const handlePopState = () => setPage(pageFromUrl());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleDefaultCompanyUpdated = (event: Event) => {
      const detail = (event as CustomEvent<DefaultCompanyBinding>).detail;
      setDefaultBinding(detail ?? readDefaultCompanyBinding());
    };
    window.addEventListener("codexsun-default-company-updated", handleDefaultCompanyUpdated);
    return () => window.removeEventListener("codexsun-default-company-updated", handleDefaultCompanyUpdated);
  }, []);

  const menuItems = useMemo(() => {
    const currentCommonKey = page.view === "common-module" ? page.definitionKey : "";
    const commonActive = page.view === "common-index" || page.view === "common-module";
    const applicationActive = page.view === "dashboard" || page.view === "application";
    const appPage = page.view === "application" ? page.page : "";
    const entryPage = page.view === "entry" ? page.page : "";

    if (applicationActive) {
      return [
        {
          title: "Overview",
          icon: LayoutDashboardIcon,
          isActive: page.view === "dashboard",
          onSelect: () => selectPage({ view: "dashboard" })
        },
        {
          title: "Application",
          icon: StoreIcon,
          isActive: true,
          items: [
            {
              title: "Company",
              isActive: appPage === "company",
              onSelect: () => selectPage({ view: "application", page: "company" })
            },
            {
              title: "Default Company",
              isActive: appPage === "default-company",
              onSelect: () => selectPage({ view: "application", page: "default-company" })
            },
            {
              title: "Accounting Year",
              isActive: appPage === "accounting-year",
              onSelect: () => selectPage({ view: "application", page: "accounting-year" })
            },
            {
              title: "Settings",
              isActive: appPage === "settings",
              onSelect: () => selectPage({ view: "application", page: "settings" })
            },
            {
              title: "User",
              isActive: appPage === "users",
              onSelect: () => selectPage({ view: "application", page: "users" })
            },
            {
              title: "Roles",
              isActive: appPage === "roles",
              onSelect: () => selectPage({ view: "application", page: "roles" })
            },
            {
              title: "Permissions",
              isActive: appPage === "permissions",
              onSelect: () => selectPage({ view: "application", page: "permissions" })
            },
            {
              title: "Landing Desk",
              isActive: appPage === "landing",
              onSelect: () => selectPage({ view: "application", page: "landing" })
            }
          ]
        }
      ];
    }

    return [
      {
        title: "Overview",
        icon: LayoutDashboardIcon,
        isActive: page.view === "billing-overview",
        onSelect: () => selectPage({ view: "billing-overview" })
      },
      {
        title: "Entries",
        icon: ReceiptTextIcon,
        isActive: page.view === "entry",
        items: [
          {
            title: "Sales",
            isActive: entryPage === "sales",
            onSelect: () => selectPage({ view: "entry", page: "sales" })
          },
          {
            title: "Purchase",
            isActive: entryPage === "purchase",
            onSelect: () => selectPage({ view: "entry", page: "purchase" })
          },
          {
            title: "Receipt",
            isActive: entryPage === "receipt",
            onSelect: () => selectPage({ view: "entry", page: "receipt" })
          },
          {
            title: "Payment",
            isActive: entryPage === "payment",
            onSelect: () => selectPage({ view: "entry", page: "payment" })
          }
        ]
      },
      {
        title: "Master",
        icon: StoreIcon,
        isActive: page.view === "contacts" || page.view === "products",
        items: [
          {
            title: "Contact",
            isActive: page.view === "contacts",
            onSelect: () => selectPage({ view: "contacts" })
          },
          {
            title: "Product",
            isActive: page.view === "products",
            onSelect: () => selectPage({ view: "products" })
          }
        ]
      },
      {
        title: "Common",
        icon: Settings2Icon,
        isActive: commonActive,
        items: commonModuleGroups.map((group) => ({
          title: group.label,
          isActive: group.modules.some((module) => module.key === currentCommonKey),
          items: group.modules.map((module) => ({
            title: module.label,
            isActive: currentCommonKey === module.key,
            onSelect: () => selectPage({ view: "common-module", definitionKey: module.key, definitionLabel: module.label })
          }))
        }))
      },
    ];
  }, [page]);

  const workspaceItems = useMemo(() => {
    const applicationActive = page.view === "dashboard" || page.view === "application";
    return [
      {
        title: "Application",
        description: "Company setup, users, roles, settings, and landing desk.",
        icon: StoreIcon,
        active: applicationActive,
        url: "/app"
      },
      {
        title: "Billing",
        description: "Sales, purchase, receipt, payment, masters, and common data.",
        icon: ReceiptTextIcon,
        active: !applicationActive,
        url: "/app/billing"
      },
      {
        title: "Mail",
        description: "Reusable workspace mail services.",
        icon: MailIcon,
        url: "/app"
      }
    ];
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
  if (page.view === "common-index") return "Common";
  if (page.view === "common-module") return page.definitionLabel;
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
