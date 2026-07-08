import { Input } from "@codexsun/ui/components/input"
import { Label } from "@codexsun/ui/components/label"
import { Switch } from "@codexsun/ui/components/switch"
import { Button } from "@codexsun/ui/components/button"
import { Plus, X } from "lucide-react"

export type AddressFormData = {
  addressId: string
  label: string
  line1: string
  line2: string
  country: string
  state: string
  district: string
  city: string
  pincode: string
  gstStateCode: string
  isDefault: boolean
  addressType: string
}

type Props = {
  addresses: AddressFormData[]
  onChange: (addresses: AddressFormData[]) => void
}

export function AddressSubForm({ addresses, onChange }: Props) {
  function addAddress() {
    onChange([
      ...addresses,
      {
        addressId: `addr_${Date.now()}`,
        label: "",
        line1: "",
        line2: "",
        country: "IN",
        state: "",
        district: "",
        city: "",
        pincode: "",
        gstStateCode: "",
        isDefault: addresses.length === 0,
        addressType: "billing",
      },
    ])
  }

  function removeAddress(id: string) {
    onChange(addresses.filter((a) => a.addressId !== id))
  }

  function updateAddress(id: string, field: keyof AddressFormData, value: string | boolean) {
    onChange(addresses.map((a) => (a.addressId === id ? { ...a, [field]: value } : a)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Addresses</span>
        <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={addAddress}>
          <Plus className="size-3.5" />
          Add address
        </Button>
      </div>
      {addresses.length === 0 && (
        <p className="text-xs text-muted-foreground">No addresses added yet.</p>
      )}
      {addresses.map((address) => (
        <div key={address.addressId} className="relative space-y-3 rounded-lg border border-border/70 p-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 size-6"
            onClick={() => removeAddress(address.addressId)}
          >
            <X className="size-3.5" />
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input className="h-9 rounded-lg text-sm" value={address.label} onChange={(e) => updateAddress(address.addressId, "label", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Input className="h-9 rounded-lg text-sm" value={address.addressType} onChange={(e) => updateAddress(address.addressId, "addressType", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="col-span-full grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Line 1</Label>
              <Input className="h-9 rounded-lg text-sm" value={address.line1} onChange={(e) => updateAddress(address.addressId, "line1", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="col-span-full grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Line 2</Label>
              <Input className="h-9 rounded-lg text-sm" value={address.line2} onChange={(e) => updateAddress(address.addressId, "line2", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input className="h-9 rounded-lg text-sm" value={address.country} onChange={(e) => updateAddress(address.addressId, "country", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">State</Label>
              <Input className="h-9 rounded-lg text-sm" value={address.state} onChange={(e) => updateAddress(address.addressId, "state", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input className="h-9 rounded-lg text-sm" value={address.city} onChange={(e) => updateAddress(address.addressId, "city", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Pincode</Label>
              <Input className="h-9 rounded-lg font-mono text-sm" value={address.pincode} onChange={(e) => updateAddress(address.addressId, "pincode", (e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
            <span className="text-xs text-muted-foreground">Default address</span>
            <Switch
              checked={address.isDefault}
              onCheckedChange={(checked: boolean) => updateAddress(address.addressId, "isDefault", checked)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
