"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../../components/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "../../../../components/sidebar"

export type SidemenuItem = {
  title: string
  url?: string
  icon: LucideIcon
  isActive?: boolean
  onSelect?: () => void
  items?: {
    isActive?: boolean
    onSelect?: () => void
    title: string
    url?: string
  }[]
}

export function SidemenuSection({ items, title }: { items: SidemenuItem[]; title?: string }) {
  return (
    <SidebarGroup>
      {title ? <SidebarGroupLabel>{title}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => {
          const subItems = item.items ?? []
          const hasItems = subItems.length > 0

          return (
            <Collapsible
              key={`${item.title}-${item.isActive ? "active" : "idle"}`}
              asChild
              defaultOpen={item.isActive ?? false}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {hasItems ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      <ChevronRight className="ml-auto text-muted-foreground transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton asChild isActive={item.isActive ?? false} tooltip={item.title}>
                    {item.onSelect ? (
                    <button type="button" onClick={item.onSelect}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </button>
                    ) : (
                      <a href={item.url ?? "#"}>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </a>
                    )}
                  </SidebarMenuButton>
                )}
                {hasItems ? (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                    {subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={subItem.isActive ?? false}>
                          {subItem.onSelect ? (
                          <button type="button" onClick={subItem.onSelect}>
                            <span>{subItem.title}</span>
                          </button>
                          ) : (
                            <a href={subItem.url ?? "#"}>
                              <span>{subItem.title}</span>
                            </a>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
