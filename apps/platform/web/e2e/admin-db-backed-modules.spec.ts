import { expect, test } from "@playwright/test"

test("apps module creates and reloads database-backed records", async ({ page }) => {
  const browserErrors: string[] = []
  const suffix = Date.now()
  const appName = `E2E App ${suffix}`
  const moduleKey = `e2e.app.${suffix}`

  collectBrowserErrors(page, browserErrors)
  await loginAsSuperAdmin(page)
  await page.goto("/sa/modules")

  await expect(page.getByRole("heading", { name: "Apps" })).toBeVisible()
  await page.getByRole("button", { name: /New app/i }).click()
  await expect(page.getByRole("heading", { name: "New app" })).toBeVisible()

  const inputs = page.locator("input")
  await inputs.nth(0).fill(appName)
  await inputs.nth(1).fill(moduleKey)
  await page.getByRole("combobox", { name: "Scope" }).click()
  await page.getByRole("option", { name: "Tenant" }).click()
  await inputs.nth(2).fill("1.0.0")
  await page.getByRole("switch").click()
  await page.getByRole("combobox", { name: "Status" }).click()
  await page.getByRole("option", { name: "Active", exact: true }).click()
  await page.getByRole("button", { name: /^Save$/ }).click()

  await expect(page.getByRole("heading", { name: appName })).toBeVisible()
  await expect(page.getByText(moduleKey, { exact: true }).first()).toBeVisible()

  await page.reload()
  await expect(page.getByRole("heading", { name: "Apps" })).toBeVisible()
  await expect(page.getByRole("button", { name: appName, exact: true })).toBeVisible()
  await expect(page.getByText(moduleKey, { exact: true }).first()).toBeVisible()

  expect(browserErrors).toEqual([])
})

test("industry module creates and reloads database-backed records", async ({ page }) => {
  const browserErrors: string[] = []
  const suffix = Date.now()
  const industryName = `E2E Industry ${suffix}`
  const industryCode = `e2e-industry-${suffix}`

  collectBrowserErrors(page, browserErrors)
  await loginAsSuperAdmin(page)
  await page.goto("/sa/industries")

  await expect(page.getByRole("heading", { name: "Industries" })).toBeVisible()
  await page.getByRole("button", { name: /New industry/i }).click()
  await expect(page.getByRole("heading", { name: "New industry" })).toBeVisible()

  const inputs = page.locator("input")
  await inputs.nth(0).fill(industryName)
  await inputs.nth(1).fill(industryCode)
  await page.getByRole("combobox", { name: "Segment" }).click()
  await page.getByRole("option", { name: "Services" }).click()
  await inputs.nth(2).fill("Service workspace template")
  await page.getByRole("combobox", { name: "Status" }).click()
  await page.getByRole("option", { name: "Active", exact: true }).click()
  await page.getByRole("button", { name: /^Save$/ }).click()

  await expect(page.getByRole("heading", { name: industryName })).toBeVisible()
  await expect(page.getByText(industryCode, { exact: true }).first()).toBeVisible()

  await page.reload()
  await expect(page.getByRole("heading", { name: "Industries" })).toBeVisible()
  await expect(page.getByRole("button", { name: industryName, exact: true })).toBeVisible()
  await expect(page.getByText(industryCode, { exact: true }).first()).toBeVisible()

  expect(browserErrors).toEqual([])
})

async function loginAsSuperAdmin(page: import("@playwright/test").Page) {
  await page.goto("/sa/login")
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1")
  await page.getByRole("button", { name: /Sign in/i }).click()
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
}

function collectBrowserErrors(page: import("@playwright/test").Page, browserErrors: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("pageerror", (error) => browserErrors.push(error.message))
}
