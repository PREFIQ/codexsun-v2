"use client"

import type { ReactNode } from "react"

export function WorkspacePrintPreview({
  children,
  className,
  label = "Print Preview",
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <section className={className}>
      <div className="mb-2 flex items-center gap-2">
        <div className="h-px flex-1 bg-border/70" />
        <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
        <div className="h-px flex-1 bg-border/70" />
      </div>
      <div className="overflow-hidden rounded-md border border-border/70 bg-white shadow-sm print:border-0 print:shadow-none">
        {children}
      </div>
    </section>
  )
}

export function WorkspacePrintSheet({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 7mm 4mm 5mm; }
        @media print { .print-sheet { width: 210mm; } }
      `}</style>
      <div className="print-sheet mx-auto w-[210mm] max-w-full origin-top bg-white font-sans text-[10px] text-black print:mx-0 print:mt-0 print:w-[198mm] print:max-w-none">
        {children}
      </div>
    </>
  )
}
