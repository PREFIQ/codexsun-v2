import { TenantRecordWorkspace, type TenantFormField } from "./TenantRecordWorkspace"

type CommonRecord = {
  code?: string
  description?: string
  id: string
  isActive: boolean
  name: string
  [key: string]: unknown
}

type Props = {
  definitionKey: string
  definitionLabel: string
  onBack?: () => void
}

const baseFields: TenantFormField[] = [
  { key: "name", label: "Name", required: true },
  { key: "code", label: "Code" },
]

const commonModuleFieldOverrides: Record<string, TenantFormField[]> = {
  "accounting-year": [
    { key: "name", label: "Name", required: true },
    { key: "startDate", label: "Start Date", required: true },
    { key: "endDate", label: "End Date", required: true },
    { key: "booksStart", label: "Books Start", required: true },
    { key: "isCurrentYear", label: "Current Year", required: true },
  ],
  cities: [
    { key: "name", label: "Name", required: true },
    { key: "districtId", label: "District", required: true, autocompleteDefinitionKey: "districts" },
  ],
  countries: [
    { key: "name", label: "Name", required: true },
    { key: "code", label: "Code", required: true },
    { key: "phoneCode", label: "Phone Code" },
  ],
  districts: [
    { key: "name", label: "Name", required: true },
    { key: "stateId", label: "State", required: true, autocompleteDefinitionKey: "states" },
  ],
  "hsn-codes": [
    { key: "description", label: "Description", required: true },
    { key: "code", label: "Code", required: true },
  ],
  priorities: [
    { key: "name", label: "Name", required: true },
    { key: "colour", label: "Colour", required: true },
    { key: "tag", label: "Tag", required: true },
  ],
  states: [
    { key: "name", label: "Name", required: true },
    { key: "code", label: "Code", required: true },
    { key: "countryId", label: "Country", required: true, autocompleteDefinitionKey: "countries" },
  ],
  taxes: [
    { key: "description", label: "Description", required: true },
    { key: "ratePercent", label: "Rate Percent", required: true },
  ],
  transports: [
    { key: "name", label: "Name", required: true },
    { key: "gst", label: "GST" },
    { key: "vehicleNo", label: "Vehicle No" },
    { key: "contactNo", label: "Contact No" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "address", label: "Address", type: "textarea" },
  ],
}

const numericFields = new Set(["ratePercent"])
const booleanFields = new Set(["isCurrentYear"])

function fieldsForModule(definitionKey: string) {
  return commonModuleFieldOverrides[definitionKey] ?? baseFields
}

function payloadFromForm(definitionKey: string, form: Record<string, string | undefined>) {
  const payload: Record<string, unknown> = { definitionKey }
  for (const field of fieldsForModule(definitionKey)) {
    const value = form[field.key]
    if (numericFields.has(field.key)) {
      payload[field.key] = Number(value || 0)
    } else if (booleanFields.has(field.key)) {
      payload[field.key] = value !== "false"
    } else {
      payload[field.key] = value || undefined
    }
  }
  return payload
}

function formFromRecord(definitionKey: string, record: CommonRecord | null) {
  const form: Record<string, string> & { isActive: string } = {
    isActive: record?.isActive === false ? "false" : "true",
  }
  for (const field of fieldsForModule(definitionKey)) {
    const value = record?.[field.key]
    if (value === undefined || value === null) {
      form[field.key] = defaultValueForField(field.key)
    } else {
      form[field.key] = String(value)
    }
  }
  return form
}

function defaultValueForField(key: string) {
  if (numericFields.has(key)) return "1"
  if (key === "isCurrentYear") return "true"
  if (key === "startDate" || key === "booksStart") return "2026-04-01"
  if (key === "endDate") return "2027-03-31"
  return ""
}

export function CommonModulePage({ definitionKey, definitionLabel, onBack }: Props) {
  const listEndpoint = `/core/common/records?definitionKey=${definitionKey}`
  const fields = fieldsForModule(definitionKey)
  const searchFields = fields.map((field) => field.key)

  return (
    <TenantRecordWorkspace<CommonRecord>
      archiveEndpoint={(record) => `/core/common/records/${record.id}/archive?definitionKey=${definitionKey}`}
      createPayload={(form) => payloadFromForm(definitionKey, form)}
      description={`Manage ${definitionLabel.toLowerCase()} records.`}
      endpoint="/core/common/records"
      fields={fields}
      forceDeleteEndpoint={(record) => `/core/common/records/${record.id}?definitionKey=${definitionKey}`}
      getId={(record) => record.id}
      getStatus={(record) => (record.isActive ? "active" : "archived")}
      listEndpoint={listEndpoint}
      newLabel="New"
      onBack={onBack}
      queryKey={["core", "common-modules", definitionKey]}
      restoreEndpoint={(record) => `/core/common/records/${record.id}/restore?definitionKey=${definitionKey}`}
      searchFields={searchFields}
      tabs={[{ value: "details", label: "Details", fields: fields.map((field) => field.key) }]}
      title={definitionLabel}
      toForm={(record) => formFromRecord(definitionKey, record)}
      updatePayload={(form) => payloadFromForm(definitionKey, form)}
      upsertSurface="dialog"
    />
  )
}

