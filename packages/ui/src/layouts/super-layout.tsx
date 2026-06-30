import type { ReactNode } from "react";
import {
  KeyRoundIcon,
  LogOutIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersRoundIcon,
  WalletCardsIcon
} from "lucide-react";

import { AppLayout } from "./app-layout";
import type { SidemenuItem } from "../blocks/menu/sidemenu/sub/sidemenu-section";

type SuperLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  menuItems?: SidemenuItem[];
  subtitle?: ReactNode;
  title?: ReactNode;
};

const superMenuItems: SidemenuItem[] = [
  {
    title: "Admin",
    url: "/sa",
    icon: WalletCardsIcon,
    isActive: true,
    items: [
      {
        title: "Console",
        url: "/sa"
      },
      {
        title: "Tenant",
        url: "/tenant"
      },
      {
        title: "Domain",
        url: "/status"
      },
      {
        title: "Subscription",
        url: "/admin"
      },
      {
        title: "Apps",
        url: "/sa"
      },
      {
        title: "Compliance",
        url: "/status"
      },
      {
        title: "Master Database",
        url: "/status"
      },
      {
        title: "Access Control",
        url: "/admin"
      }
    ]
  }
];

const superWorkspaceItems = [
  {
    title: "Platform",
    description: "Master database, tenants, domains, and controls.",
    icon: ShieldCheckIcon,
    active: true,
    url: "/sa"
  },
  {
    title: "Billing",
    description: "Sales, purchase, receipt, payment, and reports.",
    icon: ReceiptTextIcon,
    url: "/sa"
  },
  {
    title: "Tenant",
    description: "Tenant workspace and customer-facing operations.",
    icon: UsersRoundIcon,
    url: "/tenant"
  },
  {
    title: "Staff",
    description: "Internal support and activation operations.",
    icon: WalletCardsIcon,
    url: "/admin"
  }
];

export function SuperLayout({
  actions,
  children,
  menuItems = superMenuItems,
  subtitle,
  title
}: SuperLayoutProps) {
  return (
    <AppLayout
      brand={{
        href: "/sa",
        subtitle: "super-admin",
        title: "Super Admin Desk"
      }}
      headerTitle="Super Admin Desk"
      homeHref="/sa"
      logoutHref="/sa/login"
      menuItems={menuItems}
      subtitle={subtitle}
      title={title}
      user={{
        email: "sundar@sundar.com",
        fallback: "S",
        name: "SUNDAR"
      }}
      userMenuItems={[
        {
          icon: SparklesIcon,
          title: "Upgrade to Pro"
        },
        {
          icon: ShieldCheckIcon,
          title: "Account"
        },
        {
          icon: ReceiptTextIcon,
          title: "Billing"
        },
        {
          icon: KeyRoundIcon,
          title: "Access Control",
          url: "/sa"
        },
        {
          icon: LogOutIcon,
          title: "Log out",
          url: "/sa/login"
        }
      ]}
      workspaceItems={superWorkspaceItems}
    >
      {actions ? <div className="px-4 pt-4 lg:px-6">{actions}</div> : null}
      <div className="flex-1">{children}</div>
    </AppLayout>
  );
}
