import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronDown, Plus, Search, X } from "lucide-react"
import { Input } from "@codexsun/ui/components/input"
import { cn } from "@codexsun/ui/lib/utils"
import { apiGet, apiPost } from "../api"

type Props = {
  createEnabled?: boolean
  createPayload?: ((name: string) => Record<string, unknown>) | undefined
  emptyLabel?: string | undefined
  definitionKey: string
  filterRecord?: ((record: CommonLookupRecord) => boolean) | undefined
  invalid?: boolean | undefined
  value: string
  onChange: (value: string | null) => void
}

type CommonLookupRecord = {
  code?: string
  description?: string
  id: string | number
  isActive?: boolean
  name?: string
  ratePercent?: number
  [key: string]: unknown
}

type LookupOption = {
  label: string
  value: string
}

export function CommonRecordAutocomplete({
  createEnabled = true,
  createPayload,
  definitionKey,
  emptyLabel = "No records found.",
  filterRecord,
  invalid = false,
  value,
  onChange,
}: Props) {
  const queryClient = useQueryClient()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [query, setQuery] = useState("")
  const recordsQuery = useQuery({
    queryKey: ["tenant", "common-lookup", definitionKey],
    queryFn: () => apiGet<CommonLookupRecord[]>(`/core/common/records?definitionKey=${definitionKey}`, "tenant"),
  })
  const options = useMemo<LookupOption[]>(
    () =>
      (recordsQuery.data ?? [])
        .filter((record) => record.isActive !== false && (!filterRecord || filterRecord(record)))
        .map((record) => ({
          value: String(record.id),
          label: getCommonRecordLabel(record),
        })),
    [filterRecord, recordsQuery.data],
  )
  const selected = useMemo(() => findOption(options, value), [options, value])
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) =>
      [option.label, option.value].filter(Boolean).some((part) => String(part).toLowerCase().includes(term)),
    )
  }, [options, query])
  const exact = useMemo(() => findOption(options, query), [options, query])
  const canCreate = Boolean(createEnabled && query.trim() && !exact && !recordsQuery.isLoading && !isCreating)

  useEffect(() => {
    if (isOpen) return
    const nextQuery = selected?.label ?? (isRecordIdLike(value) ? "" : value)
    setQuery((current) => (current === nextQuery ? current : nextQuery))
  }, [isOpen, selected?.label, value])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  function selectOption(option: LookupOption) {
    setQuery(option.label)
    onChange(option.value)
    setIsOpen(false)
  }

  async function createOption() {
    const name = query.trim()
    if (!name) return
    setIsCreating(true)
    try {
      const created = await apiPost<CommonLookupRecord>("/core/common/records", { definitionKey, name, ...(createPayload ? createPayload(name) : {}) }, "tenant")
      void queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", definitionKey] })
      selectOption({
        value: String(created.id),
        label: getCommonRecordLabel(created),
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div ref={rootRef} className="relative z-10 w-full focus-within:z-[90]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-invalid={invalid}
          className={cn("h-11 w-full rounded-md bg-background pl-9 pr-9", invalid && "border-destructive focus-visible:ring-destructive/30")}
          role="combobox"
          value={query}
          onBlur={() => {
            if (exact) selectOption(exact)
          }}
          onChange={(event) => {
            const nextQuery = event.target.value
            const matching = findOption(options, nextQuery)
            setQuery(nextQuery)
            setIsOpen(true)
            onChange(matching?.value ?? (nextQuery || null))
          }}
          onFocus={() => setIsOpen(true)}
        />
        {value || query ? (
          <button
            aria-label="Clear selection"
            className="absolute right-8 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("")
              onChange(null)
              setIsOpen(true)
            }}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-[1400] mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-card p-1 shadow-2xl ring-1 ring-black/5 [scrollbar-color:hsl(var(--muted-foreground)/0.42)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent">
          {recordsQuery.isLoading ? <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div> : null}
          {!recordsQuery.isLoading && !filtered.length && !canCreate ? <div className="px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</div> : null}
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/60"
              onMouseDown={(event) => {
                event.preventDefault()
                selectOption(option)
              }}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{option.label}</span>
              </span>
              {option.value === value ? <Check className="size-4 shrink-0 text-primary" strokeWidth={3} /> : <span className="size-4 shrink-0" />}
            </button>
          ))}
          {canCreate || isCreating ? (
            <button
              type="button"
              disabled={isCreating}
              className={cn("flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-accent/60")}
              onMouseDown={(event) => {
                event.preventDefault()
                void createOption()
              }}
            >
              <Plus className="size-4" />
              {isCreating ? "Creating..." : `Create "${query.trim()}"`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function findOption(options: LookupOption[], value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return options.find((option) => option.value.toLowerCase() === normalized || option.label.toLowerCase() === normalized)
}

function isRecordIdLike(value: string) {
  return /^[0-9a-f-]{8,}$/i.test(value) || /^\d+$/.test(value)
}

function getCommonRecordLabel(record: CommonLookupRecord) {
  if (record.name) return String(record.name)
  if (record.description) return String(record.description)
  if (record.ratePercent !== undefined && record.ratePercent !== null) return `${record.ratePercent}%`
  return String(record.code ?? record.id)
}
