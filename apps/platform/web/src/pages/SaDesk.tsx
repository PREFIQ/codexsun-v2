import { useEffect, useState } from "react";
import {
  BotIcon,
  CircleGaugeIcon,
  ClipboardListIcon,
  DatabaseIcon,
  KeyRoundIcon,
  WalletCardsIcon
} from "lucide-react";
import { SuperLayout } from "@codexsun/ui/layouts/super-layout";
import { AuthGate } from "../components/AuthGate";
import { ConsoleHome } from "./sa/ConsoleHome";
import { DatabaseManager } from "./sa/DatabaseManager";
import { MigrationStatus } from "./sa/MigrationStatus";
import { PlatformRegistry } from "./sa/PlatformRegistry";
import { ProjectManagerDashboard } from "./sa/ProjectManagerDashboard";
import { ProjectManagerAgentNotes, ProjectManagerDiscussions, ProjectManagerMaturity } from "./sa/ProjectManagerMaturity";
import { ProjectManagerInsights } from "./sa/ProjectManagerReferenceReport";
import { ProjectManagerReleaseNotes } from "./sa/ProjectManagerReleaseNotes";
import { TenantList } from "./sa/TenantList";
import { SuperAdminModulePage, superAdminModuleConfigs, type SuperAdminModuleKey } from "./sa/SuperAdminModulePage";

type SaPage = "home" | "tenants" | "domains" | "modules" | "audit" | "migrations" | "health" | "users" | "roles" | "permissions" | "sessions" | "settings" | "features" | "workbench" | "plans" | "subscriptions" | "industries" | "platform-registry" | "project-manager-dashboard" | "project-manager-work" | "project-manager-discussions" | "project-manager-agent-security" | "project-manager-release-notes" | "project-manager-insights" | "queue" | "database" | "devdocs" | "support" | "zetro" | "gst";

const pageToMenuKey: Record<SaPage, string> = {
  audit: "audit",
  database: "database",
  devdocs: "devdocs",
  domains: "domains",
  features: "features",
  gst: "gst",
  health: "health",
  home: "home",
  industries: "industries",
  migrations: "migrations",
  modules: "modules",
  permissions: "permissions",
  "platform-registry": "platform-registry",
  "project-manager-dashboard": "project-manager-dashboard",
  "project-manager-agent-security": "project-manager-agent-security",
  "project-manager-discussions": "project-manager-discussions",
  "project-manager-release-notes": "project-manager-release-notes",
  "project-manager-insights": "project-manager-insights",
  "project-manager-work": "project-manager-work",
  plans: "plans",
  queue: "queue",
  roles: "roles",
  sessions: "sessions",
  settings: "settings",
  subscriptions: "subscriptions",
  support: "support",
  tenants: "tenants",
  users: "users",
  workbench: "workbench",
  zetro: "zetro"
};

function pageFromUrl(): SaPage {
  const url = new URL(window.location.href);
  const legacyPage = url.searchParams.get("page");
  if (isSaPage(legacyPage)) {
    return legacyPage;
  }

  const [, desk, requestedPage, ...rest] = url.pathname.split("/");
  return desk === "sa" && rest.length === 0 && isSaPage(requestedPage) ? requestedPage : "home";
}

function isSaPage(value: string | null | undefined): value is SaPage {
  return Boolean(value && value in pageToMenuKey);
}

function pathForPage(page: SaPage) {
  return page === "home" ? "/sa" : `/sa/${page}`;
}

export function SaDesk() {
  const [page, setPage] = useState<SaPage>(() => pageFromUrl());
  const [activeMenu, setActiveMenu] = useState(() => pageToMenuKey[pageFromUrl()]);

  function selectPage(nextPage: SaPage, menuKey: string = pageToMenuKey[nextPage], historyMode: "push" | "replace" = "push") {
    setPage(nextPage);
    setActiveMenu(menuKey);
    const url = new URL(window.location.href);
    url.pathname = pathForPage(nextPage);
    url.searchParams.delete("page");
    window.history[historyMode === "replace" ? "replaceState" : "pushState"]({ page: nextPage }, "", url);
  }

  useEffect(() => {
    selectPage(page, pageToMenuKey[page], "replace");
    const handlePopState = () => {
      const nextPage = pageFromUrl();
      setPage(nextPage);
      setActiveMenu(pageToMenuKey[nextPage]);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navGroups: Array<{
    icon: typeof WalletCardsIcon;
    key: string;
    label: string;
    items: Array<{ key: string; page: SaPage; label: string }>;
  }> = [
    {
      key: "admin",
      label: "Admin",
      icon: WalletCardsIcon,
      items: [
        { key: "tenants", page: "tenants", label: "Tenant" },
        { key: "domains", page: "domains", label: "Domain" },
        { key: "plans", page: "plans", label: "Plan" },
        { key: "subscriptions", page: "subscriptions", label: "Subscription" },
        { key: "modules", page: "modules", label: "Apps" },
        { key: "industries", page: "industries", label: "Industry" }
      ]
    },
    {
      key: "foundation",
      label: "Platform Foundation",
      icon: CircleGaugeIcon,
      items: [
        { key: "audit", page: "audit", label: "Compliance" },
        { key: "health", page: "health", label: "Health" },
        { key: "settings", page: "settings", label: "Settings" },
        { key: "features", page: "features", label: "Features" }
      ]
    },
    {
      key: "project-manager",
      label: "Project Manager",
      icon: ClipboardListIcon,
      items: [
        { key: "project-manager-dashboard", page: "project-manager-dashboard", label: "Dashboard" },
        { key: "platform-registry", page: "platform-registry", label: "Platform Registry" },
        { key: "project-manager-work", page: "project-manager-work", label: "Work & Automation" },
        { key: "project-manager-discussions", page: "project-manager-discussions", label: "Discussions" },
        { key: "project-manager-agent-security", page: "project-manager-agent-security", label: "Agent & Security" },
        { key: "project-manager-release-notes", page: "project-manager-release-notes", label: "Release Notes" },
        { key: "project-manager-insights", page: "project-manager-insights", label: "Insights" }
      ]
    },
    {
      key: "database",
      label: "Database",
      icon: DatabaseIcon,
      items: [
        { key: "database", page: "database", label: "Database Manager" },
        { key: "migrations", page: "migrations", label: "Migrations" }
      ]
    },
    {
      key: "access",
      label: "Access Control",
      icon: KeyRoundIcon,
      items: [
        { key: "users", page: "users", label: "Users" },
        { key: "roles", page: "roles", label: "Roles" },
        { key: "permissions", page: "permissions", label: "Permissions" },
        { key: "sessions", page: "sessions", label: "Sessions" }
      ]
    },
    {
      key: "operations",
      label: "Operations",
      icon: CircleGaugeIcon,
      items: [
        { key: "queue", page: "queue", label: "Queue" },
        { key: "support", page: "support", label: "Support" },
        { key: "workbench", page: "workbench", label: "Workbench" },
        { key: "devdocs", page: "devdocs", label: "Dev Docs" }
      ]
    },
    {
      key: "apps",
      label: "Apps & Compliance",
      icon: BotIcon,
      items: [
        { key: "zetro", page: "zetro", label: "ZETRO" },
        { key: "gst", page: "gst", label: "GST" }
      ]
    }
  ];

  const menuItems = [
    {
      title: "Overview",
      icon: CircleGaugeIcon,
      isActive: activeMenu === "home",
      onSelect: () => selectPage("home")
    },
    ...navGroups.map((group) => ({
      title: group.label,
      icon: group.icon,
      isActive: group.items.some((item) => activeMenu === item.key),
      items: group.items.map((item) => ({
        title: item.label,
        isActive: activeMenu === item.key,
        onSelect: () => selectPage(item.page, item.key)
      }))
    }))
  ];

  const modulePageKey: Partial<Record<SaPage, SuperAdminModuleKey>> = {
    audit: "audit",
    devdocs: "devdocs",
    domains: "domains",
    features: "features",
    gst: "gst",
    health: "health",
    industries: "industries",
    modules: "modules",
    permissions: "permissions",
    plans: "plans",
    queue: "queue",
    roles: "roles",
    sessions: "sessions",
    settings: "settings",
    subscriptions: "subscriptions",
    support: "support",
    users: "users",
    workbench: "workbench",
    zetro: "zetro"
  };

  const activeModuleKey = modulePageKey[page];

  return (
    <AuthGate desk="sa">
      <SuperLayout menuItems={menuItems} versionLabel={`v ${__APP_VERSION__}`}>
        {page === "home" && <ConsoleHome onNavigate={(p) => selectPage(p as SaPage)} />}
        {page === "tenants" && <TenantList onBack={() => selectPage("home")} />}
        {page === "project-manager-dashboard" && <ProjectManagerDashboard />}
        {page === "platform-registry" && <PlatformRegistry onBack={() => selectPage("home")} />}
        {page === "project-manager-work" && <ProjectManagerMaturity />}
        {page === "project-manager-discussions" && <ProjectManagerDiscussions />}
        {page === "project-manager-agent-security" && <ProjectManagerAgentNotes />}
        {page === "project-manager-release-notes" && <ProjectManagerReleaseNotes />}
        {page === "project-manager-insights" && <ProjectManagerInsights />}
        {page === "database" && <DatabaseManager onBack={() => selectPage("home")} />}
        {page === "migrations" && <MigrationStatus onBack={() => selectPage("home")} />}
        {activeModuleKey ? (
          <SuperAdminModulePage
            key={activeModuleKey}
            config={superAdminModuleConfigs[activeModuleKey]}
            onBack={() => selectPage("home")}
          />
        ) : null}
      </SuperLayout>
    </AuthGate>
  );
}
