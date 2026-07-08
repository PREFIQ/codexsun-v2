import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "../../..");

export default defineConfig({
  fullyParallel: false,
  reporter: "list",
  testDir: ".",
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:5520",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev:platform",
    cwd: workspaceRoot,
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://127.0.0.1:5520",
  },
});
