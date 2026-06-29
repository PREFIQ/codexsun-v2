import {
  Badge,
  Button,
  Card,
  Checkbox,
  DESIGN_SYSTEM_DEFAULT_STORAGE_KEY,
  DESIGN_SYSTEM_NAME,
  DESIGN_SYSTEM_VARIANT_MARKER,
  Input,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  designSystemVariants,
  getDesignSystemVariant,
  isDesignSystemVariantId
} from "@codexsun/ui";
import type { DesignSystemVariantId } from "@codexsun/ui";
import { Check, Component, LayoutDashboard, Palette, Save, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type ComponentKey =
  | "buttons"
  | "badges"
  | "forms"
  | "switches"
  | "cards"
  | "data";

const componentGroups: Record<string, ComponentKey[]> = {
  Foundations: ["buttons", "badges"],
  Controls: ["forms", "switches"],
  Surfaces: ["cards", "data"]
};

const componentLabels: Record<ComponentKey, string> = {
  badges: "Badges",
  buttons: "Buttons",
  cards: "Cards",
  data: "Data",
  forms: "Forms",
  switches: "Switches"
};

const initialVisibleComponents: Record<ComponentKey, boolean> = {
  badges: true,
  buttons: true,
  cards: true,
  data: true,
  forms: true,
  switches: true
};

function readStoredVariant(): DesignSystemVariantId {
  if (typeof window === "undefined") {
    return "default";
  }

  const stored = window.localStorage.getItem(DESIGN_SYSTEM_DEFAULT_STORAGE_KEY);
  return stored && isDesignSystemVariantId(stored) ? stored : "default";
}

export function DesignSystemPage() {
  const [activeVariantId, setActiveVariantId] =
    useState<DesignSystemVariantId>(readStoredVariant);
  const [defaultVariantId, setDefaultVariantId] =
    useState<DesignSystemVariantId>(readStoredVariant);
  const [visibleComponents, setVisibleComponents] = useState(initialVisibleComponents);

  const activeVariant = useMemo(
    () => getDesignSystemVariant(activeVariantId),
    [activeVariantId]
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-design-system", DESIGN_SYSTEM_NAME);
    document.documentElement.setAttribute(DESIGN_SYSTEM_VARIANT_MARKER, activeVariantId);
  }, [activeVariantId]);

  function saveDefaultVariant() {
    window.localStorage.setItem(DESIGN_SYSTEM_DEFAULT_STORAGE_KEY, activeVariantId);
    setDefaultVariantId(activeVariantId);
  }

  function setVisibleComponent(component: ComponentKey, value: boolean) {
    setVisibleComponents((current) => ({
      ...current,
      [component]: value
    }));
  }

  return (
    <main className="design-page">
      <header className="design-header">
        <div>
          <StatusBadge tone="blue">Design marker</StatusBadge>
          <h1>Default design system</h1>
          <p>
            Switch variants, save one as default, and inspect grouped CODEXSUN UI
            components in the same surface.
          </p>
        </div>
        <Card className="design-control-panel">
          <div className="design-control-grid">
            <label>
              <span>Variant</span>
              <Select
                value={activeVariantId}
                onValueChange={(value) => {
                  if (isDesignSystemVariantId(value)) {
                    setActiveVariantId(value);
                  }
                }}
              >
                <SelectTrigger aria-label="Design variant">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {designSystemVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button icon={<Save size={16} />} onClick={saveDefaultVariant}>
              Set default
            </Button>
          </div>
          <div className="design-marker">
            <span>{activeVariant.marker}</span>
            {defaultVariantId === activeVariantId ? (
              <Badge>
                <Check size={13} /> Default
              </Badge>
            ) : (
              <Badge variant="outline">Preview</Badge>
            )}
          </div>
        </Card>
      </header>

      <section className="design-variants">
        {designSystemVariants.map((variant) => (
          <button
            className="design-variant-card"
            data-active={variant.id === activeVariantId}
            key={variant.id}
            onClick={() => setActiveVariantId(variant.id)}
            type="button"
          >
            <span>{variant.name}</span>
            <strong>{variant.density}</strong>
            <p>{variant.description}</p>
            <div>
              {variant.palette.map((color) => (
                <i key={color} style={{ backgroundColor: color }} />
              ))}
            </div>
          </button>
        ))}
      </section>

      <Tabs defaultValue="Foundations" className="design-tabs">
        <TabsList className="design-tabs-list">
          {Object.keys(componentGroups).map((group) => (
            <TabsTrigger key={group} value={group}>
              {group}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(componentGroups).map(([group, components]) => (
          <TabsContent key={group} value={group}>
            <section className="design-component-grid">
              {components.map((componentKey) => (
                <ComponentPreviewSwitch
                  checked={visibleComponents[componentKey]}
                  key={componentKey}
                  label={componentLabels[componentKey]}
                  onCheckedChange={(checked) =>
                    setVisibleComponent(componentKey, checked)
                  }
                />
              ))}
            </section>
            <section className="design-preview-grid">
              {components.includes("buttons") && visibleComponents.buttons ? (
                <PreviewCard icon={<Component size={18} />} title="Buttons">
                  <div className="design-row">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </PreviewCard>
              ) : null}

              {components.includes("badges") && visibleComponents.badges ? (
                <PreviewCard icon={<Palette size={18} />} title="Badges">
                  <div className="design-row">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <StatusBadge tone="green">Synced</StatusBadge>
                    <StatusBadge tone="red">Blocked</StatusBadge>
                  </div>
                </PreviewCard>
              ) : null}

              {components.includes("forms") && visibleComponents.forms ? (
                <PreviewCard icon={<Settings2 size={18} />} title="Forms">
                  <div className="design-stack">
                    <Input defaultValue="Tenant workspace" aria-label="Tenant workspace" />
                    <Textarea defaultValue="Billing, accounts, and operations notes." />
                    <label className="design-check-row">
                      <Checkbox defaultChecked />
                      <span>Require tenant context</span>
                    </label>
                  </div>
                </PreviewCard>
              ) : null}

              {components.includes("switches") && visibleComponents.switches ? (
                <PreviewCard icon={<Settings2 size={18} />} title="Switches">
                  <div className="design-stack">
                    <ComponentPreviewSwitch checked label="Offline sync" />
                    <ComponentPreviewSwitch checked label="Audit trail" />
                    <ComponentPreviewSwitch label="Beta workflow" />
                  </div>
                </PreviewCard>
              ) : null}

              {components.includes("cards") && visibleComponents.cards ? (
                <PreviewCard icon={<LayoutDashboard size={18} />} title="Cards">
                  <div className="design-card-sample">
                    <strong>Tenant health</strong>
                    <span>Active subscription, clean queue, API reachable.</span>
                    <Progress value={72} />
                  </div>
                </PreviewCard>
              ) : null}

              {components.includes("data") && visibleComponents.data ? (
                <PreviewCard icon={<LayoutDashboard size={18} />} title="Data">
                  <div className="design-data-table">
                    <span>Module</span>
                    <span>Status</span>
                    <span>Billing</span>
                    <Badge variant="secondary">Ready</Badge>
                    <span>Accounting</span>
                    <Badge variant="outline">Planned</Badge>
                    <span>Offline sync</span>
                    <Badge>Active</Badge>
                  </div>
                </PreviewCard>
              ) : null}
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}

function ComponentPreviewSwitch({
  checked = false,
  label,
  onCheckedChange
}: {
  checked?: boolean;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
}) {
  const switchProps = onCheckedChange
    ? { checked, onCheckedChange }
    : { defaultChecked: checked };

  return (
    <label className="design-switch-row">
      <Switch {...switchProps} />
      <span>{label}</span>
    </label>
  );
}

function PreviewCard({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card
      action={icon}
      className="design-preview-card"
      title={title}
      description="Variant-aware component sample"
    >
      {children}
    </Card>
  );
}
