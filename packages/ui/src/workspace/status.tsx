"use client"

import type { ReactNode } from "react"
import { CheckCircle2, Minus, XCircle } from "lucide-react"
import { cn } from "../lib/utils"
import type { WorkspaceStatusTone } from "./types"

const toneStyles: Record<WorkspaceStatusTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
}

const toneIcons: Record<WorkspaceStatusTone, ReactNode> = {
  neutral: <Minus className="size-3" />,
  success: <CheckCircle2 className="size-3" />,
  warning: <CheckCircle2 className="size-3" />,
  danger: <XCircle className="size-3" />,
  info: <CheckCircle2 className="size-3" />,
}

export function WorkspaceStatusBadge({
  className,
  label,
  tone = "neutral",
}: {
  className?: string
  label: string
  tone?: WorkspaceStatusTone
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[11px] font-medium",
        toneStyles[tone],
        className,
      )}
    >
      {toneIcons[tone]}
      {label}
    </span>
  )
}

export function WorkspaceStatusToggle({
  active,
  activeLabel = "Active",
  className,
  inactiveLabel = "Inactive",
  onClick,
}: {
  active: boolean
  activeLabel?: string
  className?: string
  inactiveLabel?: string
  onClick?: () => void
}) {
  const tone: WorkspaceStatusTone = active ? "success" : "warning"
  return (
    <button
      className={cn(
        "inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border px-2 text-[11px] font-medium shadow-none hover:opacity-80",
        toneStyles[tone],
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {active ? <CheckCircle2 className="size-3" /> : <Minus className="size-3" />}
      {active ? activeLabel : inactiveLabel}
    </button>
  )
}
