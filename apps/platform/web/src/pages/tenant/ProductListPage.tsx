import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, ImagePlus, Plus, RefreshCw, Save, X } from "lucide-react"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Label } from "@codexsun/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { cn } from "@codexsun/ui/lib/utils"
import { apiGet, apiPost, apiPut } from "../../api"
import { CommonRecordAutocomplete } from "../../components/CommonRecordAutocomplete"

type ProductRecord = {
  code: string
  hsnCodeId?: string
  itemId: string
  imageUrl?: string
  name: string
  openingPrice?: number
  openingStock?: number
  productTypeId?: string
  status: "active" | "archived"
  taxId?: string
  unitId?: string
  createdAt?: string
  updatedAt?: string
}

type ProductForm = {
  code: string
  hsnCodeId: string
  isActive: boolean
  imageUrl: string
  name: string
  openingPrice: string
  openingStock: string
  productTypeId: string
  taxId: string
  unitId: string
}

export function ProductListPage({ onBack }: { onBack?: () => void }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editing, setEditing] = useState<ProductRecord | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const productsQuery = useQuery({
    queryKey: ["tenant", "products"],
    queryFn: () => apiGet<ProductRecord[]>("/core/products", "tenant"),
  })
  const productLookupsQuery = useQuery({
    queryKey: ["tenant", "product-list-lookups"],
    queryFn: async () => {
      const definitionKeys = ["product-types", "hsn-codes", "units", "taxes"] as const
      const entries = await Promise.all(
        definitionKeys.map(async (definitionKey) => {
          const records = await apiGet<Array<{ id: string; code?: string; description?: string; name?: string; ratePercent?: number }>>(
            `/core/common/records?definitionKey=${definitionKey}`,
            "tenant",
          )
          return [definitionKey, new Map(records.map((record) => [record.id, productLookupLabel(record)]))] as const
        }),
      )
      return Object.fromEntries(entries) as Record<(typeof definitionKeys)[number], Map<string, string>>
    },
  })
  const products = productsQuery.data ?? []
  const filteredProducts = useMemo(() => {
    const term = searchValue.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) =>
      [product.name, product.code, product.productTypeId, product.hsnCodeId, product.unitId, product.taxId, product.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [products, searchValue])

  if (mode === "form") {
    return (
      <ProductUpsertPage
        key={editing?.itemId ?? "new"}
        record={editing}
        onCancel={() => {
          setEditing(null)
          setMode("list")
        }}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ["tenant", "products"] })
          setEditing(null)
          setMode("list")
        }}
      />
    )
  }

  return (
    <WorkspacePage
      title="Products"
      description="Manage products and services."
      actions={
        <>
          {onBack ? (
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : null}
          <Button type="button" variant="outline" disabled={productsQuery.isFetching} onClick={() => void productsQuery.refetch()}>
            <RefreshCw className={cn("size-4", productsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" onClick={() => setMode("form")}>
            <Plus className="size-4" />
            New product
          </Button>
        </>
      }
    >
      <WorkspaceFilters searchValue={searchValue} onSearchValueChange={setSearchValue} />
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="w-16 px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Product Type</th>
                <th className="px-4 py-3">HSN Code</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">GST %</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="w-24 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.itemId} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <button className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline" type="button" onClick={() => { setEditing(product); setMode("form") }}>
                      {product.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{product.code}</td>
                  <td className="px-4 py-3">{lookupLabel(productLookupsQuery.data?.["product-types"], product.productTypeId)}</td>
                  <td className="px-4 py-3">{lookupLabel(productLookupsQuery.data?.["hsn-codes"], product.hsnCodeId)}</td>
                  <td className="px-4 py-3">{lookupLabel(productLookupsQuery.data?.units, product.unitId)}</td>
                  <td className="px-4 py-3">{lookupLabel(productLookupsQuery.data?.taxes, product.taxId)}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusBadge label={product.status} tone={product.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(product.updatedAt ?? product.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <WorkspaceRowActions
                      title={product.name}
                      onEdit={() => {
                        setEditing(product)
                        setMode("form")
                      }}
                      onDelete={() => archiveProduct(product, queryClient)}
                      onRestore={() => restoreProduct(product, queryClient)}
                      isSuspended={product.status === "archived"}
                    />
                  </td>
                </tr>
              ))}
              {!filteredProducts.length ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {productsQuery.isLoading ? "Loading products..." : "No products found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <WorkspacePagination
        page={1}
        rowsPerPage={100}
        showingLabel={`Showing ${filteredProducts.length ? 1 : 0} to ${filteredProducts.length} of ${filteredProducts.length}`}
        singularLabel="products"
        totalCount={filteredProducts.length}
        totalPages={1}
        onPageChange={() => undefined}
        onRowsPerPageChange={() => undefined}
      />
    </WorkspacePage>
  )
}

function ProductUpsertPage({
  onCancel,
  onSaved,
  record,
}: {
  onCancel: () => void
  onSaved: () => void
  record: ProductRecord | null
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductForm>(() => ({
    code: record?.code ?? "",
    hsnCodeId: record?.hsnCodeId ?? "",
    isActive: record?.status !== "archived",
    imageUrl: record?.imageUrl ?? "",
    name: record?.name ?? "",
    openingPrice: String(record?.openingPrice ?? 0),
    openingStock: String(record?.openingStock ?? 0),
    productTypeId: record?.productTypeId ?? "",
    taxId: record?.taxId ?? "",
    unitId: record?.unitId ?? "",
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) {
        setErrors({ name: "Name is required" })
        toast.error("Name is required")
        throw new Error("Validation failed")
      }
      setErrors({})
      const payload = {
        code: form.code.trim() || codeFromName(form.name),
        name: form.name.trim(),
        productTypeId: optional(form.productTypeId),
        hsnCodeId: optional(form.hsnCodeId),
        unitId: optional(form.unitId),
        taxId: optional(form.taxId),
        imageUrl: form.imageUrl,
        openingStock: numberValue(form.openingStock),
        openingPrice: numberValue(form.openingPrice),
      }
      const saved = record
        ? await apiPut<ProductRecord>(`/core/products/${record.itemId}`, payload, "tenant")
        : await apiPost<ProductRecord>("/core/products", payload, "tenant")
      if (record && record.status === "archived" && form.isActive) await apiPost(`/core/products/${record.itemId}/restore`, undefined, "tenant")
      if (record && record.status === "active" && !form.isActive) await apiPost(`/core/products/${record.itemId}/archive`, undefined, "tenant")
      if (!record && !form.isActive) await apiPost(`/core/products/${saved.itemId}/archive`, undefined, "tenant")
      return saved
    },
    onSuccess: () => {
      toast.success(record ? "Product updated" : "Product created")
      void queryClient.invalidateQueries({ queryKey: ["tenant", "products"] })
      onSaved()
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "Validation failed") return
      toast.error(error instanceof Error ? error.message : "Product save failed")
    },
  })

  return (
    <WorkspacePage
      title={record ? "Edit Product" : "New Product"}
      description="Save tenant product master data with product-specific fields."
      actions={
        <Button type="button" variant="outline" onClick={onCancel}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
          <Tabs defaultValue="details">
            <div className="border-b border-border px-6 pt-2">
              <TabsList className="h-auto rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="image"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Image
                </TabsTrigger>
                <TabsTrigger
                  value="opening"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Opening
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="details" className="m-0">
              <SectionShell>
                <div className="grid items-end gap-5 md:grid-cols-2">
                  <TextField label="Name" required value={form.name} {...(errors.name ? { error: errors.name } : {})} onChange={(name) => setForm((current) => ({ ...current, name }))} />
                  <TextField label="Code" value={form.code} onChange={(code) => setForm((current) => ({ ...current, code: code.toUpperCase() }))} />
                  <LookupField definitionKey="product-types" label="Product Type" value={form.productTypeId} onChange={(productTypeId) => setForm((current) => ({ ...current, productTypeId }))} />
                  <LookupField definitionKey="hsn-codes" label="HSN Code" value={form.hsnCodeId} onChange={(hsnCodeId) => setForm((current) => ({ ...current, hsnCodeId }))} />
                  <LookupField definitionKey="units" label="Unit" value={form.unitId} onChange={(unitId) => setForm((current) => ({ ...current, unitId }))} />
                  <LookupField definitionKey="taxes" label="GST %" value={form.taxId} onChange={(taxId) => setForm((current) => ({ ...current, taxId }))} />
                  <StatusCard label="Active" checked={form.isActive} onChange={(isActive) => setForm((current) => ({ ...current, isActive }))} className="md:col-span-2" />
                </div>
              </SectionShell>
            </TabsContent>
            <TabsContent value="image" className="m-0">
              <SectionShell>
                <div className="grid gap-5 md:grid-cols-[340px_1fr]">
                  <div className="grid gap-2">
                    <Label>Product Image</Label>
                    <label className="flex h-44 cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-sm font-medium text-muted-foreground hover:bg-muted/40">
                      <input
                        accept="image/png,image/svg+xml"
                        className="sr-only"
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          if (!["image/png", "image/svg+xml"].includes(file.type)) {
                            toast.error("Use PNG or SVG image")
                            event.currentTarget.value = ""
                            return
                          }
                          void fileToDataUrl(file).then((imageUrl) => setForm((current) => ({ ...current, imageUrl })))
                        }}
                      />
                      <span className="flex items-center gap-2">
                        <ImagePlus className="size-4" />
                        Upload PNG/SVG
                      </span>
                    </label>
                  </div>
                  <div className="grid gap-2">
                    <Label>Preview</Label>
                    <div className="flex h-44 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                      {form.imageUrl ? <img alt={form.name || "Product"} className="max-h-full max-w-full object-contain" src={form.imageUrl} /> : null}
                    </div>
                    {form.imageUrl ? (
                      <Button type="button" variant="outline" className="w-fit" onClick={() => setForm((current) => ({ ...current, imageUrl: "" }))}>
                        <X className="size-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              </SectionShell>
            </TabsContent>
            <TabsContent value="opening" className="m-0">
              <SectionShell>
                <div className="grid items-end gap-5 md:grid-cols-2">
                  <TextField label="Opening Stock" value={form.openingStock} onChange={(openingStock) => setForm((current) => ({ ...current, openingStock }))} />
                  <TextField label="Opening Price" value={form.openingPrice} onChange={(openingPrice) => setForm((current) => ({ ...current, openingPrice }))} />
                </div>
              </SectionShell>
            </TabsContent>
          </Tabs>
          <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-6 py-4">
            <Button type="submit" disabled={mutation.isPending}>
              <Save className={cn("size-4", mutation.isPending && "animate-spin")} />
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </WorkspacePage>
  )
}

function LookupField({
  definitionKey,
  label,
  onChange,
  value,
}: {
  definitionKey: string
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <CommonRecordAutocomplete
        definitionKey={definitionKey}
        value={value}
        createPayload={(name) => createPayloadForLookup(definitionKey, name)}
        onChange={(nextValue) => onChange(nextValue ?? "")}
      />
    </div>
  )
}

function TextField({
  className,
  error,
  label,
  onChange,
  required,
  value,
}: {
  className?: string | undefined
  error?: string | undefined
  label: string
  onChange: (value: string) => void
  required?: boolean | undefined
  value: string
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input className="h-11 rounded-md" value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

function StatusCard({
  checked,
  className,
  label,
  onChange,
}: {
  checked: boolean
  className?: string | undefined
  label: string
  onChange: (value: boolean) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-left transition-colors",
        checked
          ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70"
          : "border-border bg-muted/55 hover:bg-muted/75",
        className,
      )}
      onClick={() => onChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onChange(!checked)
        }
      }}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <CheckCircle2 className={cn("size-4 shrink-0", checked ? "text-emerald-600" : "text-muted-foreground")} />
        <span className="block leading-none">{label}</span>
      </span>
      <VisualSwitch checked={checked} />
    </div>
  )
}

function VisualSwitch({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-emerald-600" : "bg-muted-foreground/35",
      )}
    >
      <span
        className={cn(
          "block size-4 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </span>
  )
}

function SectionShell({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return <div className={cn("p-6", className)}>{children}</div>
}

async function archiveProduct(product: ProductRecord, queryClient: ReturnType<typeof useQueryClient>) {
  await apiPost(`/core/products/${product.itemId}/archive`, undefined, "tenant")
  toast.success("Product suspended")
  void queryClient.invalidateQueries({ queryKey: ["tenant", "products"] })
}

async function restoreProduct(product: ProductRecord, queryClient: ReturnType<typeof useQueryClient>) {
  await apiPost(`/core/products/${product.itemId}/restore`, undefined, "tenant")
  toast.success("Product restored")
  void queryClient.invalidateQueries({ queryKey: ["tenant", "products"] })
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function createPayloadForLookup(definitionKey: string, name: string) {
  if (definitionKey === "hsn-codes") {
    return {
      code: name.trim(),
      description: name.trim(),
    }
  }
  if (definitionKey === "taxes") {
    const ratePercent = Number(name.replace("%", "").trim())
    return {
      description: name.trim().endsWith("%") ? name.trim() : `${name.trim()}%`,
      ratePercent: Number.isFinite(ratePercent) ? ratePercent : 0,
    }
  }
  return {}
}

function numberValue(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"))
    reader.readAsDataURL(file)
  })
}

function productLookupLabel(record: { code?: string; description?: string; id: string; name?: string; ratePercent?: number }) {
  if (record.ratePercent !== undefined && record.ratePercent !== null) return `${record.ratePercent}%`
  if (record.code && record.description) return `${record.code} - ${record.description}`
  if (record.code && record.name) return `${record.code} - ${record.name}`
  return record.name ?? record.description ?? record.code ?? record.id
}

function lookupLabel(labels: Map<string, string> | undefined, value: string | undefined) {
  if (!value) return ""
  return labels?.get(value) ?? value
}

function codeFromName(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "PRODUCT"
}

function formatDate(value: string | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
