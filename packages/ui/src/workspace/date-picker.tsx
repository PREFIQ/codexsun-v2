"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, format, parseISO } from "date-fns"
import { Button } from "../components/button"
import { Calendar } from "../components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover"
import { WorkspaceSelect } from "./select"
import { cn } from "../lib/utils"

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  label: format(new Date(2026, index, 1), "MMM"),
  value: String(index),
}))

const yearOptions = Array.from({ length: 51 }, (_, index) => {
  const year = 2000 + index
  return { label: String(year), value: String(year) }
})

export function WorkspaceDatePicker({
  ariaLabel,
  onValueChange,
  placeholder = "Select date",
  required: _required,
  value,
}: {
  ariaLabel?: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
  value: string
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = useMemo(() => {
    if (!value) return undefined
    const parsed = parseISO(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])
  const [displayMonth, setDisplayMonth] = useState(() => selectedDate ?? new Date())

  useEffect(() => {
    if (selectedDate) setDisplayMonth(selectedDate)
  }, [selectedDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={ariaLabel ?? placeholder}
          type="button"
          variant="outline"
          className={cn(
            "h-11 w-full justify-start rounded-md border-border/80 bg-background/95 px-3 text-left text-sm font-normal shadow-sm hover:translate-y-0 hover:bg-background hover:shadow-sm active:translate-y-0 active:scale-100",
            !selectedDate && "text-muted-foreground",
          )}
        >
          <CalendarDays className="size-4 text-muted-foreground" />
          <span>{selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[120] w-[21.5rem] rounded-md border-border/80 bg-popover p-3 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="grid min-w-0 grid-cols-[6.5rem_5.75rem] gap-2">
            <WorkspaceSelect
              ariaLabel="Month"
              options={monthOptions}
              value={String(displayMonth.getMonth())}
              onValueChange={(month) => setDisplayMonth((current) => new Date(current.getFullYear(), Number(month), 1))}
            />
            <WorkspaceSelect
              ariaLabel="Year"
              options={yearOptions}
              value={String(displayMonth.getFullYear())}
              onValueChange={(year) => setDisplayMonth((current) => new Date(Number(year), current.getMonth(), 1))}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              aria-label="Previous month"
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => setDisplayMonth((current) => addMonths(current, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              aria-label="Next month"
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => setDisplayMonth((current) => addMonths(current, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <Calendar
          className="w-full [--cell-size:2.25rem]"
          classNames={{
            root: "w-full",
            months: "w-full",
            month: "w-full gap-2",
            month_grid: "w-full table-fixed",
            month_caption: "hidden",
            nav: "hidden",
            button_previous: "size-8 rounded-full",
            button_next: "size-8 rounded-full",
            weekdays: "grid grid-cols-7 gap-1",
            weekday: "flex h-8 items-center justify-center text-xs font-medium uppercase tracking-normal text-muted-foreground",
            week: "mt-1 grid grid-cols-7 gap-1",
            day: "size-9",
            today: "rounded-full bg-muted text-foreground",
          }}
          month={displayMonth}
          mode="single"
          onMonthChange={setDisplayMonth}
          selected={selectedDate}
          startMonth={new Date(2000, 0)}
          endMonth={new Date(2050, 11)}
          onSelect={(date) => {
            if (!date) return
            onValueChange(format(date, "yyyy-MM-dd"))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
