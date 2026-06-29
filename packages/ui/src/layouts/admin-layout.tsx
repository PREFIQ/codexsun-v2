import type { ReactNode } from "react";
import {
  BellIcon,
  ClipboardCheckIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MonitorCogIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UsersRoundIcon,
  WalletCardsIcon
} from "lucide-react";

import { AppLayout } from "./app-layout";
import type { SidemenuItem } from "../blocks/menu/sidemenu/sub/sidemenu-section";

type AdminLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  subtitle?: ReactNode;
  title?: ReactNode;
};

const adminMenuItems: SidemenuItem[] = [
  {
    title: "Support",
    url: "/admin",
    icon: LifeBuoyIcon,
    isActive: true,
    items: [
      {
        title: "Support Queue",
        url: "/admin"
      },
      {
        title: "Activation Review",
        url: "/admin"
      },
      {
        title: "Tenant Health",
        url: "/status"
      }
    ]
  },
  {
    title: "Tenants",
    url: "/tenant",
    icon: UsersRoundIcon
  },
  {
    title: "Billing",
    url: "/admin",
    icon: ReceiptTextIcon
  },
  {
    title: "System Status",
    url: "/status",
    icon: StethoscopeIcon
  },
  {
    title: "Notifications",
    url: "/admin",
    icon: BellIcon
  },
  {
    title: "Compliance",
    url: "/status",
    icon: ClipboardCheckIcon
  }
];

const adminWorkspaceItems = [
  {
    title: "Staff Admin",
    description: "Support, activation, and tenant operations.",
    icon: WalletCardsIcon,
    active: true,
    url: "/admin"
  },
  {
    title: "Tenant",
    description: "Tenant workspace and customer-facing operations.",
    icon: UsersRoundIcon,
    url: "/tenant"
  },
  {
    title: "Billing",
    description: "Sales, purchase, receipt, payment, and reports.",
    icon: ReceiptTextIcon,
    url: "/admin"
  },
  {
    title: "Status",
    description: "Platform health, API state, and service checks.",
    icon: MonitorCogIcon,
    url: "/status"
  }
];

export function AdminLayout({
  actions,
  children,
  subtitle = "Internal staff workspace for support and operations.",
  title = "Staff Admin Desk"
}: AdminLayoutProps) {
  return (
    <AppLayout
      brand={{
        href: "/admin",
        subtitle: "staff-admin",
        title: "Staff Admin Desk"
      }}
      headerTitle="Staff Admin Desk"
      homeHref="/admin"
      logoutHref="/admin/login"
      menuItems={adminMenuItems}
      subtitle={subtitle}
      title={title}
      user={{
        email: "admin@admin.com",
        fallback: "A",
        name: "ADMIN"
      }}
      userMenuItems={[
        {
          icon: ShieldCheckIcon,
          title: "Account"
        },
        {
          icon: MonitorCogIcon,
          title: "Notifications"
        },
        {
          icon: LifeBuoyIcon,
          title: "Support Desk",
          url: "/admin"
        },
        {
          icon: LogOutIcon,
          title: "Log out",
          url: "/admin/login"
        }
      ]}
      workspaceItems={adminWorkspaceItems}
    >
      {actions ? <div className="px-4 pt-4 lg:px-6">{actions}</div> : null}
      <div className="p-5 md:p-7">{children}</div>
    </AppLayout>
  );
}
