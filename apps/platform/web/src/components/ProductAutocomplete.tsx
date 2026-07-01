import { useEffect, useState } from "react"
import { WorkspaceAutocomplete, type AutocompleteOption } from "@codexsun/ui/workspace/autocomplete"
import { apiGet } from "../api"

type Props = {
  value: string
  onChange: (value: string | null) => void
}

export function ProductAutocomplete({ value, onChange }: Props) {
  const [options, setOptions] = useState<AutocompleteOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiGet<Array<{ id: string; code: string; name: string }>>("/core/products", "tenant")
      .then((data) => {
        if (!cancelled) {
          setOptions(data.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` })))
        }
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <WorkspaceAutocomplete
      options={options}
      value={value}
      onChange={(val) => onChange(val)}
      loading={loading}
      placeholder=""
    />
  )
}

