"use client"

import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "../components/button"
import { cn } from "../lib/utils"

export function WorkspaceUpsertPage({
  action,
  backLabel = "Back",
  children,
  className,
  description,
  onBack,
  title,
}: {
  action?: ReactNode
  backLabel?: string
  children: ReactNode
  className?: string
  description?: string
  onBack?: () => void
  title: string
}) {
  return (
    <section className={cn("mx-auto w-[94%] space-y-4 py-4 sm:w-[92%] lg:w-[90%] lg:py-5", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-normal text-foreground/80">{title}</h1>
          {description ? <p className="mt-0.5 text-sm text-muted-foreground/70">{description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onBack ? (
            <Button type="button" variant="outline" onClick={onBack} className="h-9 rounded-md">
              <ArrowLeft className="size-4" />
              {backLabel}
            </Button>
          ) : null}
          {action}
        </div>
      </div>
      {children}
    </section>
  )
}

export function WorkspaceFormPanel({
  children,
  className,
  description,
  footer,
  title,
}: {
  children: ReactNode
  className?: string
  description?: string
  footer?: ReactNode
  title?: string
}) {
  return (
    <div className={cn("rounded-md border border-border/70 bg-card/95 shadow-sm", className)}>
      {title || description ? (
        <div className="border-b border-border/70 px-5 py-4">
          {title ? <h2 className="text-base font-medium text-foreground">{title}</h2> : null}
          {description ? (
            <p className={cn("text-sm text-muted-foreground", title && "mt-1")}>{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-border/70 bg-muted/20 px-5 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function WorkspaceFormGrid({
  children,
  className,
  columns = 2,
}: {
  children: ReactNode
  className?: string
  columns?: 1 | 2 | 3
}) {
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function WorkspaceFormFooter({
  cancelLabel = "Cancel",
  children,
  className,
  onCancel,
  primaryLabel,
  primaryLoading,
  primaryProps,
}: {
  cancelLabel?: string
  children?: ReactNode
  className?: string
  onCancel?: () => void
  primaryLabel: string
  primaryLoading?: boolean
  primaryProps?: React.ComponentProps<typeof Button>
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button type="submit" disabled={primaryLoading} className="rounded-md" {...primaryProps}>
        {primaryLabel}
      </Button>
      {children}
      {onCancel ? (
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-md">
          {cancelLabel}
        </Button>
      ) : null}
    </div>
  )
}

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/dialog"

export function WorkspaceUpsertDialog({
  children,
  className,
  description,
  onClose,
  open,
  title,
}: {
  children: ReactNode
  className?: string
  description?: string
  onClose?: () => void
  open: boolean
  title: string
}) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className={cn("sm:max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
