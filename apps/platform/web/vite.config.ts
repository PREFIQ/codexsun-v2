import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "../../../dist/apps/platform/web"
  },
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 4200
  }
});
