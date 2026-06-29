"use client"

import type { ReactNode } from "react"
import { cn } from "../lib/utils"

export function WorkspacePage({
  actions,
  children,
  className,
  description,
  technicalName,
  title,
}: {
  actions?: ReactNode
  children: ReactNode
  className?: string
  description: string
  technicalName?: string
  title: string
}) {
  return (
    <section
      data-technical-name={technicalName}
      className={cn("mx-auto w-[94%] space-y-4 py-4 sm:w-[92%] lg:w-[90%] lg:py-5", className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground/80">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground/70">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
