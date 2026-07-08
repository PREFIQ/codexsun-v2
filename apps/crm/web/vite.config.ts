import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es"]
    },
    outDir: "../../../dist/apps/crm/web",
    rollupOptions: {
      external: ["react", "react-dom"]
    }
  },
  plugins: [react()]
});
