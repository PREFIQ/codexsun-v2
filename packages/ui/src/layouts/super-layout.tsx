import type { ReactNode } from "react";
import {
  AppWindowIcon,
  DatabaseIcon,
  Globe2Icon,
  KeyRoundIcon,
  LogOutIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
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
        title: "Master Modules",
        url: "/sa"
      },
      {
        title: "Tenant Registry",
        url: "/tenant"
      },
      {
        title: "Security Surface",
        url: "/admin"
      }
    ]
  },
  {
    title: "Tenant",
    url: "/tenant",
    icon: UsersRoundIcon
  },
  {
    title: "Domain",
    url: "/status",
    icon: Globe2Icon
  },
  {
    title: "Subscription",
    url: "/admin",
    icon: ReceiptTextIcon
  },
  {
    title: "Apps",
    url: "/sa",
    icon: AppWindowIcon
  },
  {
    title: "Compliance",
    url: "/status",
    icon: RefreshCwIcon
  },
  {
    title: "Master Database",
    url: "/status",
    icon: DatabaseIcon
  },
  {
    title: "Access Control",
    url: "/sa",
    icon: KeyRoundIcon
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
  subtitle = "Founder and platform control surface.",
  title = "Super Admin Desk"
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
      menuItems={superMenuItems}
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
      <div className="p-5 md:p-7">{children}</div>
    </AppLayout>
  );
}
