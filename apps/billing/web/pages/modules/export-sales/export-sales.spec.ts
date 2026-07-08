import { expect, test, type Page } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:5510";

test.describe("Billing Export Sales module", () => {
  test("opens Export Sales list through the module-owned page", async ({ page }) => {
    const browserErrors: string[] = [];
    collectBrowserErrors(page, browserErrors);

    await loginAsTenant(page);
    await page.goto("/tenant/entries/export-sales");

    await expect(page.getByRole("heading", { name: "Export Sales" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Export Sales" })).toBeVisible();
    await expect(page.getByText("Create and review export sales invoices.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Export Sales" }).first()).toBeVisible();
    expect(browserErrors).toEqual([]);
  });
});

async function loginAsTenant(page: Page) {
  await waitForApiReady(page);
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@tenant.com");
  await page.getByLabel("Password").fill("admin@123");
  await page.getByLabel("Tenant code").fill("test");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page.getByRole("heading", { name: "Application Desk" })).toBeVisible();
}

async function waitForApiReady(page: Page) {
  await expect
    .poll(
      async () => {
        try {
          const response = await page.request.get(`${apiBaseUrl}/health`);
          return response.ok();
        } catch {
          return false;
        }
      },
      { timeout: 90_000 },
    )
    .toBe(true);
}

function collectBrowserErrors(page: Page, browserErrors: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
}