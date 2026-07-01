import { TenantRecordWorkspace, type TenantFormField } from "./TenantRecordWorkspace"

type WorkOrderRecord = {
  code: string
  description?: string
  name: string
  orderId: string
  status: "active" | "archived"
}

const fields: TenantFormField[] = [
  { key: "code", label: "Code", required: true },
  { key: "name", label: "Name", required: true },
  { key: "description", label: "Description", type: "textarea" },
]

export function WorkOrderListPage({ onBack }: { onBack?: () => void }) {
  return (
    <TenantRecordWorkspace<WorkOrderRecord>
      archiveEndpoint={(record) => `/core/orders/${record.orderId}/archive`}
      createPayload={(form) => ({
        code: form.code ?? "",
        name: form.name ?? "",
        description: form.description || undefined,
      })}
      description="Manage work orders and service requests."
      endpoint="/core/orders"
      fields={fields}
      getId={(record) => record.orderId}
      getRowMeta={(record) => [record.description ?? ""]}
      newLabel="New work order"
      onBack={onBack}
      queryKey={["tenant", "work-orders"]}
      restoreEndpoint={(record) => `/core/orders/${record.orderId}/restore`}
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
        isActive: record?.status === "archived" ? "false" : "true",
      })}
      updatePayload={(form) => ({
        name: form.name ?? "",
        description: form.description || undefined,
      })}
    />
  )
}

