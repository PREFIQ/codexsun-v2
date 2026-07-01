import type { ReactNode } from "react";
import {
  BookOpenIcon,
  CreditCardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MailIcon,
  ReceiptTextIcon,
  Settings2Icon,
  StoreIcon
} from "lucide-react";

import { AppLayout } from "./app-layout";
import type { SidebarBrand } from "../blocks/menu/sidemenu/app-sidebar";
import type { TopMenuWorkspaceItem } from "../blocks/menu/sidemenu/top-menu";
import type { SidemenuItem } from "../blocks/menu/sidemenu/sub/sidemenu-section";

type TenantLayoutProps = {
  actions?: ReactNode;
  brand?: SidebarBrand;
  children: ReactNode;
  menuItems?: SidemenuItem[];
  headerTitle?: ReactNode;
  subtitle?: ReactNode;
  title?: ReactNode;
  workspaceItems?: TopMenuWorkspaceItem[];
};

const tenantMenuItems: SidemenuItem[] = [
  {
    title: "Application",
    url: "/app",
    icon: StoreIcon,
    isActive: true,
    items: [
      {
        title: "Landing Desk",
        url: "/app"
      },
      {
        title: "Company",
        url: "/app/company"
      },
      {
        title: "Settings",
        url: "/app/settings"
      }
    ]
  },
  {
    title: "Billing",
    url: "/app",
    icon: ReceiptTextIcon
  },
  {
    title: "Settings",
    url: "/app/settings",
    icon: Settings2Icon
  }
];

const tenantWorkspaceItems = [
  {
    title: "Application",
    description: "Company setup, users, roles, settings, and landing desk.",
    icon: StoreIcon,
    active: true,
    url: "/app"
  },
  {
    title: "Billing",
    description: "Sales, purchase, receipt, payment, and reports.",
    icon: ReceiptTextIcon,
    url: "/app/sales"
  },
  {
    title: "Mail",
    description: "Reusable workspace mail services.",
    icon: MailIcon,
    url: "/app"
  },
  {
    title: "Knowledge",
    description: "Application documents, guides, and shared notes.",
    icon: BookOpenIcon,
    url: "/app"
  }
];

export function TenantLayout({
  actions,
  brand,
  children,
  headerTitle = "Overview",
  menuItems = tenantMenuItems,
  subtitle = "Application workspace for the test tenant.",
  title = "Application Desk",
  workspaceItems = tenantWorkspaceItems
}: TenantLayoutProps) {
  return (
    <AppLayout
      brand={{
        ...brand,
        href: "/app",
        subtitle: brand?.subtitle ?? "application workspace",
        title: brand?.title ?? "Application Desk"
      }}
      headerTitle={headerTitle}
      homeHref="/app"
      logoutHref="/login"
      menuItems={menuItems}
      subtitle={subtitle}
      title={title}
      user={{
        email: "admin@tenant.com",
        fallback: "A",
        name: "ADMIN"
      }}
      userMenuItems={[
        {
          icon: CreditCardIcon,
          title: "Billing",
          url: "/app/sales"
        },
        {
          icon: LifeBuoyIcon,
          title: "Support",
          url: "/status"
        },
        {
          icon: Settings2Icon,
          title: "Account",
          url: "/app/settings"
        },
        {
          icon: LogOutIcon,
          title: "Log out",
          url: "/login"
        }
      ]}
      workspaceItems={workspaceItems}
    >
      {actions ? <div className="px-4 pt-4 lg:px-6">{actions}</div> : null}
      <div>{children}</div>
    </AppLayout>
  );
}
