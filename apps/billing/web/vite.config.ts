import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "pages/index.ts",
      fileName: "index",
      formats: ["es"]
    },
    outDir: "../../../dist/apps/billing/web",
    rollupOptions: {
      external: ["react", "react-dom", "@tanstack/react-query", "@codexsun/core-web"]
    }
  },
  plugins: [react()]
});
