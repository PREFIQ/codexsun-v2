import { TenantRecordWorkspace, type TenantFormField } from "./TenantRecordWorkspace"

type WorkOrderRecord = {
  code: string
  description?: string
  id: string
  isActive: boolean
  name: string
}

const fields: TenantFormField[] = [
  { key: "code", label: "Code", required: true },
  { key: "name", label: "Name", required: true },
  { key: "description", label: "Description", type: "textarea" },
]

export function WorkOrderListPage({ onBack }: { onBack?: () => void }) {
  return (
    <TenantRecordWorkspace<WorkOrderRecord>
      archiveEndpoint={(record) => `/core/common/records/${record.id}/archive?definitionKey=work-orders`}
      createPayload={(form) => ({
        definitionKey: "work-orders",
        code: form.code ?? "",
        name: form.name ?? "",
        description: form.description || undefined,
      })}
      description="Manage work orders and service requests."
      endpoint="/core/common/records"
      fields={fields}
      getId={(record) => record.id}
      getRowMeta={(record) => [record.description ?? ""]}
      getStatus={(record) => (record.isActive ? "active" : "archived")}
      listEndpoint="/core/common/records?definitionKey=work-orders"
      newLabel="New work order"
      onBack={onBack}
      queryKey={["tenant", "work-orders"]}
      restoreEndpoint={(record) => `/core/common/records/${record.id}/restore?definitionKey=work-orders`}
      searchFields={["code", "name", "description"]}
      tabs={[
        { value: "details", label: "Details", fields: ["code", "name"] },
        { value: "notes", label: "Notes", fields: ["description"] },
      ]}
      title="Work Orders"
      toForm={(record) => ({
        code: record?.code ?? "",
        name: record?.name ?? "",
        description: record?.description ?? "",
        isActive: record?.isActive === false ? "false" : "true",
      })}
      updatePayload={(form) => ({
        definitionKey: "work-orders",
        code: form.code ?? "",
        name: form.name ?? "",
        description: form.description || undefined,
      })}
    />
  )
}
