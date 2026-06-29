"use client"

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { useState, type ReactNode } from "react"
import { cn } from "../lib/utils"

export function WorkspaceTable<T>({
  columns,
  data,
  emptyState,
  isLoading,
  minWidth = "640px",
  onRowClick,
}: {
  columns: ColumnDef<T>[]
  data: T[]
  emptyState?: ReactNode
  isLoading?: boolean
  minWidth?: string
  onRowClick?: (row: T) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? (
                          <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
                        ) : null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/20",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2.5 text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.getRowModel().rows.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm text-muted-foreground">
          {isLoading ? "Loading data..." : emptyState ?? "No records found."}
        </div>
      ) : null}
    </div>
  )
}

export function WorkspaceTablePanel({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-border/70 bg-card/95 shadow-sm">
      {children}
    </div>
  )
}
