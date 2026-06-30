import { defineConfig } from "@playwright/test"

export default defineConfig({
  fullyParallel: false,
  reporter: "list",
  testDir: "apps/platform/web/e2e",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:5520",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev:platform",
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://127.0.0.1:5520",
  },
})
