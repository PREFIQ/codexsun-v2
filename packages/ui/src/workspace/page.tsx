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
  description?: string
  technicalName?: string
  title: string
}) {
  return (
    <section
      data-technical-name={technicalName}
      className={cn("mx-auto w-[calc(100%-2rem)] max-w-[92rem] space-y-4 py-4 lg:w-[calc(100%-3rem)] lg:py-5", className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {title ? <h1 className="text-2xl font-semibold tracking-normal text-foreground/80">{title}</h1> : null}
          {description ? <p className="mt-0.5 text-sm text-muted-foreground/70">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
