import { useEffect, useState } from "react"
import { WorkspaceAutocomplete, type AutocompleteOption } from "@codexsun/ui/workspace/autocomplete"
import { apiGet } from "../api"

type Props = {
  definitionKey: string
  value: string
  onChange: (value: string | null) => void
}

export function CommonRecordAutocomplete({ definitionKey, value, onChange }: Props) {
  const [options, setOptions] = useState<AutocompleteOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiGet<Array<{ id: string; code: string; name: string }>>(`/core/common/records?definitionKey=${definitionKey}`, "tenant")
      .then((data) => {
        if (!cancelled) {
          setOptions(data.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` })))
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [definitionKey])

  return (
    <WorkspaceAutocomplete
      options={options}
      value={value}
      onChange={(val) => onChange(val)}
      loading={loading}
      placeholder="Search records..."
    />
  )
}
