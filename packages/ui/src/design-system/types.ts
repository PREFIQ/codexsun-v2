export type DesignSystemVariantId = "default" | "compact" | "clear";

export type DesignSystemVariant = {
  id: DesignSystemVariantId;
  name: string;
  description: string;
  marker: string;
  radius: string;
  density: string;
  palette: string[];
};
