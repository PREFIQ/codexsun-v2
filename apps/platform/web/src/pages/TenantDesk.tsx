import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, TenantLayout } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { logout } from "../api";
import { ContactListPage } from "./tenant/ContactListPage";
import { ProductListPage } from "./tenant/ProductListPage";
import { WorkOrderListPage } from "./tenant/WorkOrderListPage";
import { CommonModuleIndexPage } from "./tenant/CommonModuleIndexPage";
import { CommonModulePage } from "./tenant/CommonModulePage";

type TenantPage =
  | { view: "dashboard" }
  | { view: "contacts" }
  | { view: "products" }
  | { view: "work-orders" }
  | { view: "master-data" }
  | { view: "common-module"; definitionKey: string; definitionLabel: string };

export function TenantDesk() {
  const navigate = useNavigate();
  const [page, setPage] = useState<TenantPage>({ view: "dashboard" });

  async function handleLogout() {
    await logout("tenant");
    await navigate({ to: "/login" });
  }

  type NavEntry = { view: TenantPage; label: string };
  const navSections: Array<{ heading: string; items: NavEntry[] }> = [
    {
      heading: "Main",
      items: [
        { view: { view: "dashboard" }, label: "Dashboard" },
      ],
    },
    {
      heading: "Modules",
      items: [
        { view: { view: "contacts" }, label: "Contacts" },
        { view: { view: "products" }, label: "Products" },
        { view: { view: "work-orders" }, label: "Work Orders" },
      ],
    },
    {
      heading: "Configuration",
      items: [
        { view: { view: "master-data" }, label: "Master Data" },
      ],
    },
  ];

  function renderPage() {
    switch (page.view) {
      case "contacts":
        return (
          <ContactListPage onBack={() => setPage({ view: "dashboard" })} />
        );
      case "products":
        return (
          <ProductListPage onBack={() => setPage({ view: "dashboard" })} />
        );
      case "work-orders":
        return (
          <WorkOrderListPage onBack={() => setPage({ view: "dashboard" })} />
        );
      case "master-data":
        return (
          <CommonModuleIndexPage
            onNavigate={(key, label) => setPage({ view: "common-module", definitionKey: key, definitionLabel: label })}
          />
        );
      case "common-module":
        return (
          <CommonModulePage
            definitionKey={page.definitionKey}
            definitionLabel={page.definitionLabel}
            onBack={() => setPage({ view: "master-data" })}
          />
        );
      default:
        return (
          <div className="desk-grid">
            <div className="rounded-lg border border-border/70 bg-card/95 p-6 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold">Welcome</h2>
              <p className="text-sm text-muted-foreground">
                Select a module from the navigation bar to get started.
              </p>
            </div>
          </div>
        );
    }
  }

  return (
    <AuthGate desk="tenant">
      <TenantLayout
        actions={
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem" }}>
            {navSections.map((section) => (
              <div key={section.heading} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                {section.items.map((item) => {
                  const isActive =
                    page.view === item.view.view ||
                    (page.view === "common-module" && item.view.view === "master-data");
                  return (
                    <Button
                      key={item.label}
                      onClick={() => setPage(item.view)}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                    >
                      {item.label}
                    </Button>
                  );
                })}
                <span style={{ width: "1px", height: "20px", background: "var(--border)", margin: "0 0.25rem" }} />
              </div>
            ))}
            <Button onClick={handleLogout} variant="secondary" size="sm">Log out</Button>
          </div>
        }
      >
        {renderPage()}
      </TenantLayout>
    </AuthGate>
  );
}
