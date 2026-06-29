"use client"

import * as React from "react"
import {
  BadgeCheckIcon,
  ChevronsUpDownIcon,
  type LucideIcon,
  LogOutIcon,
  MonitorCogIcon,
  PanelsTopLeftIcon,
  ReceiptTextIcon,
  SparklesIcon
} from "lucide-react"

import { SidemenuSection, type SidemenuItem } from "./sub/sidemenu-section"
import { Avatar, AvatarFallback } from "../../../components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../../components/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "../../../components/sidebar"

export type SidebarBrand = {
  href?: string
  logoAlt?: string
  logoDarkSrc?: string
  logoSrc?: string
  subtitle: string
  title: string
}

export type SidebarUser = {
  email: string
  fallback: string
  name: string
}

export type SidebarUserMenuItem = {
  icon: LucideIcon
  title: string
  url?: string
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  brand: SidebarBrand
  items: SidemenuItem[]
  user: SidebarUser
  userMenuItems?: SidebarUserMenuItem[]
  versionLabel?: string
}

const defaultUserMenuItems: SidebarUserMenuItem[] = [
  {
    icon: SparklesIcon,
    title: "Upgrade to Pro"
  },
  {
    icon: BadgeCheckIcon,
    title: "Account"
  },
  {
    icon: ReceiptTextIcon,
    title: "Billing"
  },
  {
    icon: MonitorCogIcon,
    title: "Notifications"
  },
  {
    icon: PanelsTopLeftIcon,
    title: "Super Admin login"
  },
  {
    icon: LogOutIcon,
    title: "Log out",
    url: "/login"
  }
]

export function AppSidebar({
  brand,
  className,
  items,
  user,
  userMenuItems = defaultUserMenuItems,
  versionLabel = "v 1.0.2",
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className={className}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={brand.title} className="h-14">
              <a href={brand.href ?? "/workspace"}>
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg border bg-background">
                  <img alt={brand.logoAlt ?? brand.title} className="size-5 dark:hidden" src={brand.logoSrc ?? "/logo/logo.svg"} />
                  <img alt={brand.logoAlt ?? brand.title} className="hidden size-5 dark:block" src={brand.logoDarkSrc ?? "/logo/logo-dark.svg"} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">{brand.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{brand.subtitle}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidemenuSection items={items} />
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">{versionLabel}</div>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="h-14">
                  <Avatar className="size-9 border bg-background">
                    <AvatarFallback>{user.fallback}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <div className="truncate font-semibold">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-56 p-2">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="size-9 border bg-background">
                    <AvatarFallback>{user.fallback}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{user.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {userMenuItems.map((item, index) => (
                  <React.Fragment key={item.title}>
                    {index === userMenuItems.length - 1 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem asChild={Boolean(item.url)}>
                      {item.url ? (
                        <a href={item.url}>
                          <item.icon />
                          {item.title}
                        </a>
                      ) : (
                        <>
                          <item.icon />
                          {item.title}
                        </>
                      )}
                    </DropdownMenuItem>
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
