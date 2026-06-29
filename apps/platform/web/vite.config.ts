import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "../../../dist/apps/platform/web",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@dnd-kit") || id.includes("node_modules/@tanstack/react-table")) {
            return "workspace-table";
          }

          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "workspace-charts";
          }

          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/vaul") ||
            id.includes("node_modules/sonner")
          ) {
            return "workspace-ui";
          }

          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
        }
      }
    }
  },
  plugins: [tailwindcss(), react()],
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PLATFORM_WEB_PORT) || 5520
  }
});
