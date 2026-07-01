import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Save, Send, Trash2, X } from "lucide-react"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Label } from "@codexsun/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codexsun/ui/components/select"
import { Switch } from "@codexsun/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs"
import { Textarea } from "@codexsun/ui/components/textarea"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspaceLookup, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { cn } from "@codexsun/ui/lib/utils"
import { apiGet, apiPost, apiPut } from "../../api"

type ContactStatus = "active" | "archived"

type ContactEmail = {
  id?: string
  uuid?: string
  email: string
  emailType: string
  isPrimary: boolean
  isActive: boolean
}

type ContactPhone = {
  id?: string
  uuid?: string
  phoneNumber: string
  phoneType: string
  isPrimary: boolean
  isActive: boolean
}

type AddressBookEntry = {
  id?: string
  uuid?: string
  addressTypeId: string
  addressLine1: string
  addressLine2: string
  countryId: string
  stateId: string
  districtId: string
  cityId: string
  pincodeId: string
  isDefault: boolean
  isActive: boolean
}

type ContactBankAccount = {
  id?: string
  uuid?: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  ifsc: string
  branch: string
  isPrimary: boolean
  isActive: boolean
}

type ContactSocialLink = {
  id?: string
  uuid?: string
  platform: string
  url: string
  isActive: boolean
}

type ContactRecord = {
  contactId: string
  code: string
  name: string
  contactTypeId?: string
  legalName?: string
  pan?: string
  gstin?: string
  msmeType?: string
  msmeNo?: string
  tan?: string
  tdsAvailable?: boolean
  tcsAvailable?: boolean
  openingBalance?: number
  balanceType?: string
  creditLimit?: number
  website?: string
  primaryEmail?: string
  primaryPhone?: string
  description?: string
  addressBook?: AddressBookEntry[]
  contactEmails?: ContactEmail[]
  contactPhones?: ContactPhone[]
  contactSocialLinks?: ContactSocialLink[]
  contactBankAccounts?: ContactBankAccount[]
  contactGstDetails?: Array<{ id?: string; uuid?: string; gstin?: string; state?: string; isDefault: boolean; isActive: boolean }>
  status: ContactStatus
  updatedAt?: string
}

type ContactForm = {
  contactId: string
  code: string
  name: string
  contactTypeId: string
  legalName: string
  pan: string
  gstin: string
  msmeType: string
  msmeNo: string
  tan: string
  tdsAvailable: boolean
  tcsAvailable: boolean
  openingBalance: string
  creditLimit: string
  website: string
  description: string
  isActive: boolean
  resyncTally: boolean
  contactEmails: ContactEmail[]
  contactPhones: ContactPhone[]
  addressBook: AddressBookEntry[]
  contactBankAccounts: ContactBankAccount[]
  contactSocialLinks: ContactSocialLink[]
}

const contactEmailTypes = ["Primary", "Work", "Personal", "Billing", "Other"]
const contactPhoneTypes = ["Mobile", "Work", "Home", "WhatsApp", "Other"]
const msmeCategories = ["Micro", "Small", "Medium"]
const socialPlatforms = ["Website", "LinkedIn", "Facebook", "Instagram", "X", "YouTube", "Other"]
const contactTabs: Array<[string, string]> = [
  ["details", "Details"],
  ["tax", "Tax Details"],
  ["communication", "Communication"],
  ["addresses", "Addresses"],
  ["finance", "Finance"],
  ["more", "More"],
]

export function ContactListPage({ onBack }: { onBack?: () => void }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"list" | "form">("list")
  const [editing, setEditing] = useState<ContactRecord | null>(null)
  const [query, setQuery] = useState("")
  const contactsQuery = useQuery({
    queryKey: ["tenant", "contacts"],
    queryFn: () => apiGet<ContactRecord[]>("/core/contacts", "tenant"),
  })
  const contactTypesQuery = useQuery({
    queryKey: ["tenant", "common-lookup", "contact-types"],
    queryFn: () => apiGet<Array<{ id: string; code?: string; description?: string; name?: string }>>("/core/common/records?definitionKey=contact-types", "tenant"),
  })
  const contactTypeLabels = useMemo(() => commonLookupLabelMap(contactTypesQuery.data), [contactTypesQuery.data])
  const contacts = contactsQuery.data ?? []
  const filteredContacts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter((contact) =>
      [contact.name, contact.code, contact.contactTypeId, contact.primaryEmail, contact.primaryPhone, contact.gstin]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(normalized)),
    )
  }, [contacts, query])

  function openNew() {
    setEditing(null)
    setMode("form")
  }

  function openEdit(record: ContactRecord) {
    setEditing(record)
    setMode("form")
  }

  if (mode === "form") {
    return (
      <ContactUpsertPage
        key={editing?.contactId ?? "new"}
        record={editing}
        onCancel={() => {
          setEditing(null)
          setMode("list")
        }}
        onSaved={() => {
          void queryClient.invalidateQueries({ queryKey: ["tenant", "contacts"] })
          setEditing(null)
          setMode("list")
        }}
      />
    )
  }

  return (
    <WorkspacePage
      title="Contacts"
      description="Manage customers, suppliers, and other business contacts."
      actions={
        <>
          {onBack ? (
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void contactsQuery.refetch()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" onClick={openNew}>
            <Plus className="size-4" />
            New contact
          </Button>
        </>
      }
    >

      <WorkspaceFilters searchValue={query} onSearchValueChange={setQuery} />

      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/45 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="w-16 px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="w-24 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => (
                <tr key={contact.contactId} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3">
                    <button
                      className="cursor-pointer text-left font-semibold text-primary underline-offset-4 hover:underline"
                      type="button"
                      onClick={() => openEdit(contact)}
                    >
                      {contact.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{contact.code}</td>
                  <td className="px-4 py-3">{lookupLabel(contactTypeLabels, contact.contactTypeId)}</td>
                  <td className="px-4 py-3">{contact.primaryPhone ?? ""}</td>
                  <td className="px-4 py-3">{contact.primaryEmail ?? ""}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusBadge label={contact.status} tone={contact.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(contact.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <WorkspaceRowActions
                      title={contact.name}
                      onEdit={() => openEdit(contact)}
                      onDelete={() => archiveContact(contact, queryClient)}
                      onRestore={() => restoreContact(contact, queryClient)}
                      isSuspended={contact.status === "archived"}
                    />
                  </td>
                </tr>
              ))}
              {!filteredContacts.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No contacts found.
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
        showingLabel={`Showing ${filteredContacts.length ? 1 : 0} to ${filteredContacts.length} of ${filteredContacts.length}`}
        singularLabel="contacts"
        totalCount={filteredContacts.length}
        totalPages={1}
        onPageChange={() => undefined}
        onRowsPerPageChange={() => undefined}
      />
    </WorkspacePage>
  )
}

function ContactUpsertPage({
  onCancel,
  onSaved,
  record,
}: {
  onCancel: () => void
  onSaved: () => void
  record: ContactRecord | null
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ContactForm>(() => contactToForm(record))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const mutation = useMutation({
    mutationFn: async () => {
      const validation = validateContact(form)
      setErrors(validation)
      if (Object.keys(validation).length) {
        toast.error(Object.values(validation)[0])
        throw new Error("Validation failed")
      }
      const payload = contactPayload(form)
      const saved = record
        ? await apiPut<ContactRecord>(`/core/contacts/${record.contactId}`, payload, "tenant")
        : await apiPost<ContactRecord>("/core/contacts", payload, "tenant")
      if (record && record.status === "archived" && form.isActive) await apiPost(`/core/contacts/${record.contactId}/restore`, undefined, "tenant")
      if (record && record.status === "active" && !form.isActive) await apiPost(`/core/contacts/${record.contactId}/archive`, undefined, "tenant")
      if (!record && !form.isActive) await apiPost(`/core/contacts/${saved.contactId}/archive`, undefined, "tenant")
      return saved
    },
    onSuccess: () => {
      toast.success(record ? "Contact updated" : "Contact created")
      void queryClient.invalidateQueries({ queryKey: ["tenant", "contacts"] })
      onSaved()
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "Validation failed") return
      toast.error(error instanceof Error ? error.message : "Contact save failed")
    },
  })

  return (
    <WorkspacePage
      title={record ? "Edit contact" : "New contact"}
      description="Update contact identity, tax, communication, address, and finance details."
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
              {contactTabs.map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="details" className="m-0">
            <SectionShell>
              <div className="grid gap-5 md:grid-cols-2">
                <TextField label="Name" required value={form.name} {...(errors.name ? { error: errors.name } : {})} onChange={(name) => updateForm(setForm, { name })} />
                <TextField label="Code" value={form.code} onChange={(code) => updateForm(setForm, { code })} />
                <TextField label="Legal name" value={form.legalName} onChange={(legalName) => updateForm(setForm, { legalName })} />
                <LookupField
                  definitionKey="contact-types"
                  label="Contact Type"
                  required
                  value={form.contactTypeId}
                  {...(errors.contactTypeId ? { error: errors.contactTypeId } : {})}
                  onChange={(contactTypeId) => updateForm(setForm, { contactTypeId })}
                />
                <TextField label="Opening balance" type="number" value={form.openingBalance} onChange={(openingBalance) => updateForm(setForm, { openingBalance })} />
                <TextField label="Credit limit" type="number" value={form.creditLimit} onChange={(creditLimit) => updateForm(setForm, { creditLimit })} />
              </div>
              <StatusCard label="Active" checked={form.isActive} onChange={(isActive) => updateForm(setForm, { isActive })} className="mt-5" />
            </SectionShell>
          </TabsContent>

          <TabsContent value="tax" className="m-0">
            <SectionShell>
              <div className="grid gap-5 md:grid-cols-2">
                <TextField label="GSTIN" value={form.gstin} onChange={(gstin) => updateForm(setForm, { gstin })} />
                <TextField label="PAN" value={form.pan} onChange={(pan) => updateForm(setForm, { pan })} />
                <TextField label="MSME No" value={form.msmeNo} onChange={(msmeNo) => updateForm(setForm, { msmeNo })} />
                <SelectField label="MSME Category" value={form.msmeType} options={msmeCategories} onChange={(msmeType) => updateForm(setForm, { msmeType })} />
                <TextField label="TAN No" value={form.tan} onChange={(tan) => updateForm(setForm, { tan })} />
                <div className="grid self-end gap-4 sm:grid-cols-2">
                  <StatusCard label="TDS Available" help="Enable TDS applicability." checked={form.tdsAvailable} onChange={(tdsAvailable) => updateForm(setForm, { tdsAvailable })} />
                  <StatusCard label="TCS Available" help="Enable TCS applicability." checked={form.tcsAvailable} onChange={(tcsAvailable) => updateForm(setForm, { tcsAvailable })} />
                </div>
              </div>
            </SectionShell>
          </TabsContent>

          <TabsContent value="communication" className="m-0">
            <SectionShell className="grid gap-5">
              <CollectionCard title="Contact Emails" onAdd={() => setForm((current) => ({ ...current, contactEmails: [...current.contactEmails, emptyEmail(current.contactEmails.length === 0)] }))}>
                {form.contactEmails.map((email, index) => (
                  <div key={email.uuid ?? index} className="grid items-end gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <TextField label="Email" value={email.email} onChange={(value) => updateArray(setForm, "contactEmails", index, { email: value })} />
                    <SelectField label="Email type" value={email.emailType} options={contactEmailTypes} onChange={(value) => updateArray(setForm, "contactEmails", index, { emailType: value })} />
                    <StatusCard label="Primary" checked={email.isPrimary} onChange={(value) => updatePrimary(setForm, "contactEmails", index, value)} />
                    <RemoveButton label="Remove email" onClick={() => removeArrayItem(setForm, "contactEmails", index, emptyEmail(true))} />
                  </div>
                ))}
              </CollectionCard>

              <CollectionCard title="Contact Phones" onAdd={() => setForm((current) => ({ ...current, contactPhones: [...current.contactPhones, emptyPhone(current.contactPhones.length === 0)] }))}>
                {form.contactPhones.map((phone, index) => (
                  <div key={phone.uuid ?? index} className="grid items-end gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <TextField label="Phone" value={phone.phoneNumber} onChange={(value) => updateArray(setForm, "contactPhones", index, { phoneNumber: value })} />
                    <SelectField label="Phone type" value={phone.phoneType} options={contactPhoneTypes} onChange={(value) => updateArray(setForm, "contactPhones", index, { phoneType: value })} />
                    <StatusCard label="Primary" checked={phone.isPrimary} onChange={(value) => updatePrimary(setForm, "contactPhones", index, value)} />
                    <RemoveButton label="Remove phone" onClick={() => removeArrayItem(setForm, "contactPhones", index, emptyPhone(true))} />
                  </div>
                ))}
              </CollectionCard>
            </SectionShell>
          </TabsContent>

          <TabsContent value="addresses" className="m-0">
            <SectionShell>
              <CollectionCard title="Addresses" onAdd={() => setForm((current) => ({ ...current, addressBook: [...current.addressBook, emptyAddress(current.addressBook.length === 0)] }))}>
                {form.addressBook.map((address, index) => (
                  <div key={address.uuid ?? index} className="grid items-end gap-5 rounded-md border border-border p-4 md:grid-cols-2">
                    <LookupField definitionKey="address-types" label="Address Type" value={address.addressTypeId} onChange={(value) => updateArray(setForm, "addressBook", index, { addressTypeId: value })} />
                    <div className="flex items-end justify-end">
                      <RemoveButton label="Remove address" onClick={() => removeArrayItem(setForm, "addressBook", index, emptyAddress(true))} />
                    </div>
                    <div className="md:col-span-2">
                      <TextField label="Address line 1" value={address.addressLine1} onChange={(value) => updateArray(setForm, "addressBook", index, { addressLine1: value })} />
                    </div>
                    <TextField className="md:col-span-2" label="Address line 2" value={address.addressLine2} onChange={(value) => updateArray(setForm, "addressBook", index, { addressLine2: value })} />
                    <LookupField definitionKey="countries" label="Country" value={address.countryId} onChange={(value) => updateArray(setForm, "addressBook", index, { countryId: value })} />
                    <LookupField definitionKey="states" label="State" value={address.stateId} onChange={(value) => updateArray(setForm, "addressBook", index, { stateId: value })} />
                    <LookupField definitionKey="districts" label="District" value={address.districtId} onChange={(value) => updateArray(setForm, "addressBook", index, { districtId: value })} />
                    <LookupField definitionKey="cities" label="City" value={address.cityId} onChange={(value) => updateArray(setForm, "addressBook", index, { cityId: value })} />
                    <LookupField definitionKey="pincodes" label="Pincode" value={address.pincodeId} onChange={(value) => updateArray(setForm, "addressBook", index, { pincodeId: value })} />
                    <StatusCard label="Default address" checked={address.isDefault} onChange={(value) => updatePrimary(setForm, "addressBook", index, value, "isDefault")} />
                  </div>
                ))}
              </CollectionCard>
            </SectionShell>
          </TabsContent>

          <TabsContent value="finance" className="m-0">
            <SectionShell>
              <CollectionCard title="Bank Accounts" onAdd={() => setForm((current) => ({ ...current, contactBankAccounts: [...current.contactBankAccounts, emptyBank(current.contactBankAccounts.length === 0)] }))}>
                {form.contactBankAccounts.map((bank, index) => (
                  <div key={bank.uuid ?? index} className="grid items-end gap-5 rounded-md border border-border p-4 md:grid-cols-2">
                    <LookupField
                      definitionKey="bank-names"
                      label="Bank name"
                      value={bank.bankName}
                      storeLabel
                      onChange={(value) => updateArray(setForm, "contactBankAccounts", index, { bankName: value })}
                    />
                    <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                      <TextField label="Account number" value={bank.accountNumber} onChange={(value) => updateArray(setForm, "contactBankAccounts", index, { accountNumber: value })} />
                      <RemoveButton label="Remove bank" onClick={() => removeArrayItem(setForm, "contactBankAccounts", index, emptyBank(true))} />
                    </div>
                    <TextField label="Holder name" value={bank.accountHolderName} onChange={(value) => updateArray(setForm, "contactBankAccounts", index, { accountHolderName: value })} />
                    <TextField label="IFSC" value={bank.ifsc} onChange={(value) => updateArray(setForm, "contactBankAccounts", index, { ifsc: value })} />
                    <TextField label="Branch" value={bank.branch} onChange={(value) => updateArray(setForm, "contactBankAccounts", index, { branch: value })} />
                    <StatusCard label="Primary bank" checked={bank.isPrimary} onChange={(value) => updatePrimary(setForm, "contactBankAccounts", index, value)} />
                  </div>
                ))}
              </CollectionCard>
            </SectionShell>
          </TabsContent>

          <TabsContent value="more" className="m-0">
            <SectionShell className="grid gap-5">
              <TextField label="Website" value={form.website} onChange={(website) => updateForm(setForm, { website })} className="max-w-xl" />
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea className="min-h-28 rounded-md" value={form.description} onChange={(event) => updateForm(setForm, { description: event.target.value })} />
              </div>
              <CollectionCard title="Social Links" onAdd={() => setForm((current) => ({ ...current, contactSocialLinks: [...current.contactSocialLinks, emptySocial()] }))}>
                {form.contactSocialLinks.map((social, index) => (
                  <div key={social.uuid ?? index} className="grid items-end gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <SelectField label="Platform" value={social.platform} options={socialPlatforms} onChange={(value) => updateArray(setForm, "contactSocialLinks", index, { platform: value })} />
                    <TextField label="URL" value={social.url} onChange={(value) => updateArray(setForm, "contactSocialLinks", index, { url: value })} />
                    <StatusCard label="Active" checked={social.isActive} onChange={(value) => updateArray(setForm, "contactSocialLinks", index, { isActive: value })} />
                    <RemoveButton label="Remove social link" onClick={() => removeArrayItem(setForm, "contactSocialLinks", index, emptySocial())} />
                  </div>
                ))}
              </CollectionCard>
            </SectionShell>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <Button type="submit" disabled={mutation.isPending}>
            <Save className="size-4" />
            Save
          </Button>
          <div className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium">
            <Switch checked={form.resyncTally} onCheckedChange={(resyncTally) => updateForm(setForm, { resyncTally })} />
            <Send className="size-4 text-muted-foreground" />
            Resync to Tally after save
          </div>
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
  error,
  label,
  onChange,
  required,
  storeLabel = false,
  value,
}: {
  definitionKey: string
  error?: string | undefined
  label: string
  onChange: (value: string) => void
  required?: boolean | undefined
  storeLabel?: boolean | undefined
  value: string
}) {
  const queryClient = useQueryClient()
  const lookupQuery = useQuery({
    queryKey: ["tenant", "common-lookup", definitionKey],
    queryFn: () => apiGet<Array<{ id: string; code?: string; name?: string; description?: string }>>(`/core/common/records?definitionKey=${definitionKey}`, "tenant"),
  })
  const options = useMemo<WorkspaceLookupOption[]>(
    () =>
      (lookupQuery.data ?? []).map((record) => ({
        value: record.id,
        label: record.name ?? record.description ?? record.code ?? record.id,
        ...(record.code ? { meta: record.code } : {}),
      })),
    [lookupQuery.data],
  )

  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <WorkspaceLookup
        createLabel="Create"
        createMode="inline"
        loading={lookupQuery.isLoading}
        options={options}
        placeholder=""
        value={value}
        onCreate={async (name) => {
          const created = await apiPost<{ id: string; code?: string; name?: string; description?: string }>("/core/common/records", { definitionKey, name }, "tenant")
          void queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", definitionKey] })
          const option: WorkspaceLookupOption = {
            value: created.id,
            label: created.name ?? created.description ?? created.code ?? name,
            ...(created.code ? { meta: created.code } : {}),
          }
          return option
        }}
        onValueChange={(nextValue, option) => onChange(storeLabel ? option?.label ?? nextValue : nextValue)}
      />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

function TextField({
  className,
  error,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  className?: string | undefined
  error?: string | undefined
  label: string
  onChange: (value: string) => void
  required?: boolean | undefined
  type?: string | undefined
  value: string
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input className="h-11 rounded-md" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function StatusCard({
  checked,
  className,
  help,
  label,
  onChange,
}: {
  checked: boolean
  className?: string
  help?: string
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
        <span className="min-w-0">
          <span className="block leading-none">{label}</span>
          {help ? <span className="block text-xs font-normal text-muted-foreground">{help}</span> : null}
        </span>
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

function SectionShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-6", className)}>{children}</div>
}

function CollectionCard({ children, onAdd, title }: { children: ReactNode; onAdd: () => void; title: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button aria-label={label} className="self-end" type="button" size="icon" variant="outline" onClick={onClick}>
      <Trash2 className="size-4" />
    </Button>
  )
}

function contactToForm(record: ContactRecord | null): ContactForm {
  return {
    contactId: record?.contactId ?? "",
    code: record?.code ?? "",
    name: record?.name ?? "",
    contactTypeId: record?.contactTypeId ?? "",
    legalName: record?.legalName ?? "",
    pan: record?.pan ?? "",
    gstin: record?.gstin ?? "",
    msmeType: record?.msmeType ?? "",
    msmeNo: record?.msmeNo ?? "",
    tan: record?.tan ?? "",
    tdsAvailable: Boolean(record?.tdsAvailable),
    tcsAvailable: Boolean(record?.tcsAvailable),
    openingBalance: numberToField(record?.openingBalance),
    creditLimit: numberToField(record?.creditLimit),
    website: record?.website ?? "",
    description: record?.description ?? "",
    isActive: record?.status !== "archived",
    resyncTally: false,
    contactEmails: normalizeRows(record?.contactEmails, emptyEmail(true)),
    contactPhones: normalizeRows(record?.contactPhones, emptyPhone(true)),
    addressBook: normalizeRows(record?.addressBook, emptyAddress(true)),
    contactBankAccounts: normalizeRows(record?.contactBankAccounts, emptyBank(true)),
    contactSocialLinks: normalizeRows(record?.contactSocialLinks, emptySocial()),
  }
}

function contactPayload(form: ContactForm) {
  const contactId = form.contactId || newId()
  const emails = form.contactEmails.map((email) => ({
    ...email,
    id: email.id ?? newId(),
    uuid: email.uuid ?? newId(),
    contactId,
  }))
  const phones = form.contactPhones.map((phone) => ({
    ...phone,
    id: phone.id ?? newId(),
    uuid: phone.uuid ?? newId(),
    contactId,
  }))
  const addresses = form.addressBook.map((address) => ({
    ...address,
    id: address.id ?? newId(),
    uuid: address.uuid ?? newId(),
    ownerType: "contact",
    ownerId: contactId,
  }))
  const banks = form.contactBankAccounts.map((bank) => ({
    ...bank,
    id: bank.id ?? newId(),
    uuid: bank.uuid ?? newId(),
    contactId,
  }))
  const socialLinks = form.contactSocialLinks.map((social) => ({
    ...social,
    id: social.id ?? newId(),
    uuid: social.uuid ?? newId(),
    contactId,
  }))
  return {
    code: form.code.trim() || codeFromName(form.name),
    name: form.name.trim(),
    contactTypeId: optional(form.contactTypeId),
    legalName: optional(form.legalName),
    pan: optional(form.pan),
    gstin: optional(form.gstin),
    msmeType: optional(form.msmeType),
    msmeNo: optional(form.msmeNo),
    tan: optional(form.tan),
    tdsAvailable: form.tdsAvailable,
    tcsAvailable: form.tcsAvailable,
    openingBalance: numberFromField(form.openingBalance),
    creditLimit: numberFromField(form.creditLimit),
    website: optional(form.website),
    primaryEmail: emails.find((email) => email.isPrimary)?.email || emails.find((email) => email.email)?.email || undefined,
    primaryPhone: phones.find((phone) => phone.isPrimary)?.phoneNumber || phones.find((phone) => phone.phoneNumber)?.phoneNumber || undefined,
    description: optional(form.description),
    addressBook: addresses,
    contactEmails: emails,
    contactPhones: phones,
    contactSocialLinks: socialLinks,
    contactBankAccounts: banks,
    contactGstDetails: form.gstin
      ? [{ id: newId(), uuid: newId(), contactId, gstin: form.gstin, state: "", isDefault: true, isActive: true }]
      : [],
  }
}

function validateContact(form: ContactForm) {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = "Name is required"
  if (!form.contactTypeId.trim()) errors.contactTypeId = "Contact type is required"
  return errors
}

function emptyEmail(isPrimary = false): ContactEmail {
  return { id: newId(), uuid: newId(), email: "", emailType: "Primary", isPrimary, isActive: true }
}

function emptyPhone(isPrimary = false): ContactPhone {
  return { id: newId(), uuid: newId(), phoneNumber: "", phoneType: "Mobile", isPrimary, isActive: true }
}

function emptyAddress(isDefault = false): AddressBookEntry {
  return {
    id: newId(),
    uuid: newId(),
    addressTypeId: "",
    addressLine1: "",
    addressLine2: "",
    countryId: "",
    stateId: "",
    districtId: "",
    cityId: "",
    pincodeId: "",
    isDefault,
    isActive: true,
  }
}

function emptyBank(isPrimary = false): ContactBankAccount {
  return { id: newId(), uuid: newId(), bankName: "", accountNumber: "", accountHolderName: "", ifsc: "", branch: "", isPrimary, isActive: true }
}

function emptySocial(): ContactSocialLink {
  return { id: newId(), uuid: newId(), platform: "Website", url: "", isActive: true }
}

function updateForm(setForm: Dispatch<SetStateAction<ContactForm>>, patch: Partial<ContactForm>) {
  setForm((current) => ({ ...current, ...patch }))
}

function updateArray<Key extends keyof Pick<ContactForm, "contactEmails" | "contactPhones" | "addressBook" | "contactBankAccounts" | "contactSocialLinks">>(
  setForm: Dispatch<SetStateAction<ContactForm>>,
  key: Key,
  index: number,
  patch: Partial<ContactForm[Key][number]>,
) {
  setForm((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
  }))
}

function updatePrimary<Key extends "contactEmails" | "contactPhones" | "addressBook" | "contactBankAccounts">(
  setForm: Dispatch<SetStateAction<ContactForm>>,
  key: Key,
  index: number,
  checked: boolean,
  field: "isPrimary" | "isDefault" = "isPrimary",
) {
  setForm((current) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) => ({ ...item, [field]: itemIndex === index ? checked : checked ? false : item[field as keyof typeof item] })),
  }))
}

function removeArrayItem<Key extends keyof Pick<ContactForm, "contactEmails" | "contactPhones" | "addressBook" | "contactBankAccounts" | "contactSocialLinks">>(
  setForm: Dispatch<SetStateAction<ContactForm>>,
  key: Key,
  index: number,
  fallback: ContactForm[Key][number],
) {
  setForm((current) => {
    const nextRows = current[key].filter((_, itemIndex) => itemIndex !== index)
    return { ...current, [key]: nextRows.length ? nextRows : [fallback] }
  })
}

async function archiveContact(contact: ContactRecord, queryClient: ReturnType<typeof useQueryClient>) {
  await apiPost(`/core/contacts/${contact.contactId}/archive`, undefined, "tenant")
  toast.success("Contact suspended")
  void queryClient.invalidateQueries({ queryKey: ["tenant", "contacts"] })
}

async function restoreContact(contact: ContactRecord, queryClient: ReturnType<typeof useQueryClient>) {
  await apiPost(`/core/contacts/${contact.contactId}/restore`, undefined, "tenant")
  toast.success("Contact restored")
  void queryClient.invalidateQueries({ queryKey: ["tenant", "contacts"] })
}

function normalizeRows<T>(rows: T[] | undefined, fallback: T) {
  return rows?.length ? rows : [fallback]
}

function numberToField(value: number | undefined) {
  return value === undefined || value === null ? "" : String(value)
}

function numberFromField(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function optional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function commonLookupLabelMap(records: Array<{ id: string; code?: string; description?: string; name?: string }> | undefined) {
  return new Map((records ?? []).map((record) => [record.id, record.name ?? record.description ?? record.code ?? record.id]))
}

function lookupLabel(labels: Map<string, string>, value: string | undefined) {
  if (!value) return ""
  return labels.get(value) ?? value
}

function codeFromName(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "CONTACT"
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatDate(value: string | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
