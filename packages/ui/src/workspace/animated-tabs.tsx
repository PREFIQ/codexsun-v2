"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs"
import { cn } from "../lib/utils"

export type WorkspaceAnimatedTab = {
  content: ReactNode
  label: ReactNode
  value: string
}

export function WorkspaceAnimatedTabs({
  className,
  contentClassName,
  keepMounted = false,
  listClassName,
  onValueChange,
  tabs,
  triggerClassName,
  value,
}: {
  className?: string
  contentClassName?: string
  keepMounted?: boolean
  listClassName?: string
  onValueChange: (value: string) => void
  tabs: WorkspaceAnimatedTab[]
  triggerClassName?: string
  value: string
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.value === value)
    const activeTabElement = tabRefs.current[activeIndex]

    if (activeTabElement) {
      setUnderlineStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      })
    }
  }, [tabs, value])

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("w-full", className)}>
      <TabsList
        className={cn(
          "relative h-auto w-full justify-start rounded-md border border-border/70 bg-background p-0 shadow-sm",
          listClassName,
        )}
      >
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab.value}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            value={tab.value}
            className={cn(
              "relative z-10 rounded-none border-0 bg-transparent px-5 py-3 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none",
              triggerClassName,
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-primary"
          animate={underlineStyle}
          transition={{ damping: 40, stiffness: 400, type: "spring" }}
        />
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          {...(keepMounted ? { forceMount: true } : {})}
          className={cn("mt-4", keepMounted && "data-[state=inactive]:hidden", contentClassName)}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
