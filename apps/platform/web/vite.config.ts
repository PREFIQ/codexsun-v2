import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const rootPackage = JSON.parse(readFileSync(resolve(configDir, "../../../package.json"), "utf8")) as { version: string };

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "../../../dist/apps/platform/web",
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("node_modules/@dnd-kit") || normalizedId.includes("node_modules/@tanstack/react-table")) {
            return "workspace-table";
          }

          if (normalizedId.includes("node_modules/recharts") || normalizedId.includes("node_modules/d3-")) {
            return "workspace-charts";
          }

          if (normalizedId.includes("node_modules/lucide-react")) {
            return "icons";
          }

          if (normalizedId.includes("node_modules/@tanstack/react-query") || normalizedId.includes("node_modules/@tanstack/react-router")) {
            return "tanstack";
          }

          if (normalizedId.includes("node_modules/framer-motion") || normalizedId.includes("node_modules/motion-dom") || normalizedId.includes("node_modules/motion-utils")) {
            return "motion";
          }

          if (
            normalizedId.includes("node_modules/@radix-ui") ||
            normalizedId.includes("node_modules/vaul") ||
            normalizedId.includes("node_modules/sonner")
          ) {
            return "workspace-ui";
          }

          if (normalizedId.includes("node_modules/react") || normalizedId.includes("node_modules/react-dom")) {
            return "react";
          }

          if (normalizedId.includes("/packages/ui/src/workspace/")) {
            return "workspace-system";
          }

          if (normalizedId.includes("/packages/ui/src/design-system/")) {
            return "design-system";
          }

          if (normalizedId.includes("/packages/ui/src/blocks/")) {
            return "ui-blocks";
          }

          if (normalizedId.includes("/packages/ui/src/layouts/")) {
            return "ui-layouts";
          }

          if (
            normalizedId.includes("/packages/ui/src/components/dialog") ||
            normalizedId.includes("/packages/ui/src/components/drawer") ||
            normalizedId.includes("/packages/ui/src/components/dropdown-menu") ||
            normalizedId.includes("/packages/ui/src/components/hover-card") ||
            normalizedId.includes("/packages/ui/src/components/menubar") ||
            normalizedId.includes("/packages/ui/src/components/navigation-menu") ||
            normalizedId.includes("/packages/ui/src/components/popover") ||
            normalizedId.includes("/packages/ui/src/components/select") ||
            normalizedId.includes("/packages/ui/src/components/sheet") ||
            normalizedId.includes("/packages/ui/src/components/tabs") ||
            normalizedId.includes("/packages/ui/src/components/toast") ||
            normalizedId.includes("/packages/ui/src/components/toaster") ||
            normalizedId.includes("/packages/ui/src/components/sonner") ||
            normalizedId.includes("/packages/ui/src/components/tooltip")
          ) {
            return "ui-overlays";
          }

          if (
            normalizedId.includes("/packages/ui/src/components/calendar") ||
            normalizedId.includes("/packages/ui/src/components/carousel") ||
            normalizedId.includes("/packages/ui/src/components/chart") ||
            normalizedId.includes("/packages/ui/src/components/pagination") ||
            normalizedId.includes("/packages/ui/src/components/progress") ||
            normalizedId.includes("/packages/ui/src/components/resizable") ||
            normalizedId.includes("/packages/ui/src/components/scroll-area") ||
            normalizedId.includes("/packages/ui/src/components/skeleton") ||
            normalizedId.includes("/packages/ui/src/components/table")
          ) {
            return "ui-data";
          }

          if (
            normalizedId.includes("/packages/ui/src/components/") ||
            normalizedId.includes("/packages/ui/src/lib/")
          ) {
            return "codexsun-ui";
          }

          if (normalizedId.includes("/apps/platform/web/src/pages/sa/")) {
            return "sa-pages";
          }

          if (normalizedId.includes("/apps/core/web/src/pages/tenant/")) {
            return "core-tenant-pages";
          }

          if (normalizedId.includes("/apps/billing/web/pages/modules/")) {
            return "billing-modules";
          }

          if (normalizedId.includes("/apps/billing/web/shared/")) {
            return "billing-shared";
          }

          if (normalizedId.includes("/apps/platform/web/src/pages/tenant/")) {
            return "tenant-pages";
          }

          if (normalizedId.includes("/apps/platform/web/src/pages/templates/")) {
            return "template-pages";
          }
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(rootPackage.version)
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      { find: /^@codexsun\/core-web\/(.*)$/, replacement: resolve(configDir, "../../../apps/core/web/src/$1") },
      { find: "@codexsun/core-web", replacement: resolve(configDir, "../../../apps/core/web/src/index.ts") },
      { find: /^@codexsun\/billing-web\/(.*)$/, replacement: resolve(configDir, "../../../apps/billing/web/pages/$1") },
      { find: "@codexsun/billing-web", replacement: resolve(configDir, "../../../apps/billing/web/pages/index.ts") },
    ]
  },
  server: {
    headers: {
      "Permissions-Policy": "unload=*"
    },
    host: "127.0.0.1",
    port: Number(process.env.PLATFORM_WEB_PORT) || 5520
  }
});
