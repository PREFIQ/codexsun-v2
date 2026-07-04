"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select"

export type WorkspaceSelectOption = {
  label: string
  value: string
}

export function WorkspaceSelect({
  ariaLabel,
  onValueChange,
  options,
  placeholder = "Select",
  required: _required,
  value,
}: {
  ariaLabel?: string
  onValueChange: (value: string) => void
  options: WorkspaceSelectOption[]
  placeholder?: string
  required?: boolean
  value: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel ?? placeholder}
        className="h-11 w-full rounded-md border-border/80 bg-background/95 text-sm shadow-sm"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[160] rounded-md border-border/80">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="rounded-sm">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
