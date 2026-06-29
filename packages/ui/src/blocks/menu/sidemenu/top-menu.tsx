"use client"

import {
  BellIcon,
  BriefcaseBusinessIcon,
  CheckIcon,
  ChevronDownIcon,
  HomeIcon,
  type LucideIcon,
  LogOutIcon,
  MailIcon,
  NewspaperIcon,
  ReceiptTextIcon,
  SparklesIcon,
  SunIcon,
  WrenchIcon
} from "lucide-react"

import { Button } from "../../../components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../../components/dropdown-menu"
import { Separator } from "../../../components/separator"
import { SidebarTrigger } from "../../../components/sidebar"

export type TopMenuWorkspaceItem = {
  active?: boolean
  description: string
  icon: LucideIcon
  title: string
  url?: string
}

export type TopMenuProps = {
  homeHref?: string
  logoutHref?: string
  pageTitle?: string
  workspaceItems?: TopMenuWorkspaceItem[]
}

const defaultWorkspaceItems: TopMenuWorkspaceItem[] = [
  {
    title: "Application",
    description: "Shared workspace, company setup, and modules.",
    icon: BriefcaseBusinessIcon
  },
  {
    title: "ZETRO",
    description: "Business assistance chat for teams.",
    icon: SparklesIcon
  },
  {
    title: "Billing",
    description: "Sales, purchase, receipt, payment, and reports.",
    icon: ReceiptTextIcon,
    active: true
  },
  {
    title: "Mail",
    description: "Reusable workspace mail services.",
    icon: MailIcon
  },
  {
    title: "Blog",
    description: "Tenant-scoped posts, categories, and updates.",
    icon: NewspaperIcon
  },
  {
    title: "Sites",
    description: "Public tenant site content and pages.",
    icon: WrenchIcon
  }
]

export function TopMenu({
  homeHref = "/workspace",
  logoutHref = "/login",
  pageTitle = "Billing Desk",
  workspaceItems = defaultWorkspaceItems
}: TopMenuProps) {
  const activeWorkspace = workspaceItems.find((item) => item.active) ?? workspaceItems[0]
  const ActiveWorkspaceIcon = activeWorkspace?.icon ?? BriefcaseBusinessIcon

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background">
      <div className="flex h-full min-w-0 items-center">
        <div className="flex h-full w-16 items-center justify-center border-r">
          <SidebarTrigger className="size-8 rounded-md border bg-background shadow-none" />
        </div>
        <div className="flex min-w-0 items-center gap-3 px-4 text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                <ActiveWorkspaceIcon className="size-4 text-muted-foreground" />
                <span>{activeWorkspace?.title ?? "Workspace"}</span>
                <ChevronDownIcon className="size-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-2">
              <DropdownMenuLabel className="px-2 text-xs font-medium text-muted-foreground">
                Switch app
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaceItems.map((item) => (
                <DropdownMenuItem key={item.title} asChild={Boolean(item.url)} className="gap-3 p-2">
                  {item.url ? (
                    <a href={item.url}>
                      <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                        <item.icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.description}</div>
                      </div>
                      {item.active ? <CheckIcon className="size-4" /> : null}
                    </a>
                  ) : (
                    <>
                      <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                        <item.icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.description}</div>
                      </div>
                      {item.active ? <CheckIcon className="size-4" /> : null}
                    </>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="h-4" />
          <span className="truncate font-medium">{pageTitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3">
        <Button aria-label="Desk tools" size="icon" variant="outline" className="size-8">
          <BriefcaseBusinessIcon />
        </Button>
        <Button aria-label="Notifications" size="icon" variant="outline" className="relative size-8">
          <BellIcon />
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            3
          </span>
        </Button>
        <Button asChild size="sm" variant="outline" className="hidden h-8 px-3 sm:inline-flex">
          <a href={homeHref}>
            <HomeIcon />
            Home
          </a>
        </Button>
        <Button asChild size="sm" variant="outline" className="hidden h-8 px-3 sm:inline-flex">
          <a href={logoutHref}>
            <LogOutIcon />
            Logout
          </a>
        </Button>
        <Button aria-label="Theme" size="icon" variant="outline" className="size-8">
          <SunIcon />
        </Button>
      </div>
    </header>
  )
}
