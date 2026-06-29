import type { ReactNode } from "react";
import {
  BookOpenIcon,
  CreditCardIcon,
  FileTextIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MailIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShoppingCartIcon,
  StoreIcon,
  UsersRoundIcon
} from "lucide-react";

import { AppLayout } from "./app-layout";
import type { SidemenuItem } from "../blocks/menu/sidemenu/sub/sidemenu-section";

type TenantLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  subtitle?: ReactNode;
  title?: ReactNode;
};

const tenantMenuItems: SidemenuItem[] = [
  {
    title: "Dashboard",
    url: "/tenant",
    icon: StoreIcon,
    isActive: true,
    items: [
      {
        title: "Overview",
        url: "/tenant"
      },
      {
        title: "Activity",
        url: "/tenant"
      },
      {
        title: "Reports",
        url: "/tenant"
      }
    ]
  },
  {
    title: "Customers",
    url: "/tenant",
    icon: UsersRoundIcon
  },
  {
    title: "Items",
    url: "/tenant",
    icon: ShoppingCartIcon
  },
  {
    title: "Billing",
    url: "/tenant",
    icon: ReceiptTextIcon
  },
  {
    title: "Documents",
    url: "/tenant",
    icon: FileTextIcon
  },
  {
    title: "Settings",
    url: "/tenant",
    icon: Settings2Icon
  }
];

const tenantWorkspaceItems = [
  {
    title: "Tenant",
    description: "Customer-facing workspace and tenant operations.",
    icon: StoreIcon,
    active: true,
    url: "/tenant"
  },
  {
    title: "Billing",
    description: "Sales, purchase, receipt, payment, and reports.",
    icon: ReceiptTextIcon,
    url: "/tenant"
  },
  {
    title: "Mail",
    description: "Reusable workspace mail services.",
    icon: MailIcon,
    url: "/tenant"
  },
  {
    title: "Knowledge",
    description: "Tenant documents, guides, and shared notes.",
    icon: BookOpenIcon,
    url: "/tenant"
  }
];

export function TenantLayout({
  actions,
  children,
  subtitle = "Customer-facing workspace for the test tenant.",
  title = "Tenant Desk"
}: TenantLayoutProps) {
  return (
    <AppLayout
      brand={{
        href: "/tenant",
        subtitle: "tenant workspace",
        title: "Tenant Desk"
      }}
      headerTitle="Tenant"
      homeHref="/tenant"
      logoutHref="/login"
      menuItems={tenantMenuItems}
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
          url: "/tenant"
        },
        {
          icon: LifeBuoyIcon,
          title: "Support",
          url: "/status"
        },
        {
          icon: Settings2Icon,
          title: "Account"
        },
        {
          icon: LogOutIcon,
          title: "Log out",
          url: "/login"
        }
      ]}
      workspaceItems={tenantWorkspaceItems}
    >
      {actions ? <div className="px-4 pt-4 lg:px-6">{actions}</div> : null}
      <div className="p-5 md:p-7">{children}</div>
    </AppLayout>
  );
}
