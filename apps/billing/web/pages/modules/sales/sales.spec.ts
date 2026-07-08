import { expect, test, type Page } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:5510";

test.describe("Billing Sales module", () => {
  test("opens Sales list through the Sales-owned module page", async ({ page }) => {
    const browserErrors: string[] = [];
    collectBrowserErrors(page, browserErrors);

    await loginAsTenant(page);
    await page.goto("/tenant/entries/sales");

    await expect(page.getByRole("heading", { name: "Sales" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Sales" })).toBeVisible();
    await expect(page.getByText("Create and review sales invoices.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sales" }).first()).toBeVisible();
    expect(browserErrors).toEqual([]);
  });

  test("opens Sales settings from the Sales module settings page", async ({ page }) => {
    const browserErrors: string[] = [];
    collectBrowserErrors(page, browserErrors);

    await loginAsTenant(page);
    await page.goto("/tenant/settings/sales-settings");

    await expect(page.getByRole("heading", { name: "Sales Settings" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Layout" })).toBeVisible();
    await expect(page.getByText("Use PO in sales")).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish live" })).toBeVisible();
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
