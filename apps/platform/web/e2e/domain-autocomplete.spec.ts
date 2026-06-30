import { expect, test } from "@playwright/test"

test("domain tenant autocomplete can create, persist after refresh, and force delete", async ({ page }) => {
  const browserErrors: string[] = []
  const tenantName = `E2E Tenant ${Date.now()}`
  const tenantCode = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  const domainName = `${tenantCode.toLowerCase()}.local`

  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("pageerror", (error) => browserErrors.push(error.message))

  await page.goto("/sa/login")
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1")
  await page.getByRole("button", { name: /Sign in/i }).click()
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
  await page.goto("/sa/domains")

  await expect(page.getByRole("heading", { name: "Tenant Domains" })).toBeVisible()
  await page.getByRole("button", { name: /New domain/i }).click()
  await expect(page.getByRole("heading", { name: "New domain" })).toBeVisible()

  await page.locator("input").first().fill(domainName)

  const tenantLookup = page.getByRole("combobox").first()
  await tenantLookup.fill(tenantName)
  await page.getByRole("button", { name: new RegExp(`Create tenant "${escapeRegex(tenantName)}"`) }).click()
  const createTenantDialog = page.getByRole("dialog", { name: "Create tenant" })
  await expect(createTenantDialog).toBeVisible()
  await expect(createTenantDialog.getByRole("textbox")).toHaveValue(tenantName)
  await page.getByRole("button", { name: /^Create tenant$/ }).click()
  await expect(tenantLookup).toHaveValue(tenantCode)

  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("heading", { name: domainName })).toBeVisible()
  await expect(page.getByText(tenantCode, { exact: true }).first()).toBeVisible()

  await page.reload()
  await expect(page.getByRole("heading", { name: "Tenant Domains" })).toBeVisible()
  await expect(page.getByRole("button", { name: domainName, exact: true })).toBeVisible()
  await expect(page.getByText(tenantCode, { exact: true }).first()).toBeVisible()

  await page.getByRole("button", { name: `${domainName} actions` }).click()
  await page.getByRole("menuitem", { name: /Force delete/i }).click()
  const deleteDialog = page.getByRole("dialog", { name: "Permanently delete domain" })
  await expect(deleteDialog).toBeVisible()
  await expect(deleteDialog.getByRole("button", { name: /Delete permanently/i })).toBeDisabled()
  await deleteDialog.getByLabel("Confirm domain name").fill(domainName)
  await deleteDialog.getByRole("button", { name: /Delete permanently/i }).click()
  await expect(page.getByRole("button", { name: domainName, exact: true })).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole("heading", { name: "Tenant Domains" })).toBeVisible()
  await expect(page.getByRole("button", { name: domainName, exact: true })).toHaveCount(0)

  expect(browserErrors).toEqual([])
})

test("subscription tenant lookup can create, save, and persist after refresh", async ({ page }) => {
  const browserErrors: string[] = []
  const tenantName = `E2E Subscription Tenant ${Date.now()}`
  const tenantCode = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  const planName = `Professional ${Date.now()}`

  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("pageerror", (error) => browserErrors.push(error.message))

  await page.goto("/sa/login")
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1")
  await page.getByRole("button", { name: /Sign in/i }).click()
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
  await page.goto("/sa/subscriptions")

  await expect(page.getByRole("heading", { name: "Subscriptions" })).toBeVisible()
  await page.getByRole("button", { name: /New subscription/i }).click()
  await expect(page.getByRole("heading", { name: "New subscription" })).toBeVisible()

  const planLookup = page.getByPlaceholder("Search plan")
  await planLookup.fill(planName)
  await page.getByRole("button", { name: new RegExp(`Create plan "${escapeRegex(planName)}"`) }).click()
  const createPlanDialog = page.getByRole("dialog", { name: "Create plan" })
  await expect(createPlanDialog).toBeVisible()
  await page.getByRole("button", { name: /^Create plan$/ }).click()
  await expect(planLookup).toHaveValue(planName)

  const tenantLookup = page.getByPlaceholder("Search tenant")
  await tenantLookup.fill(tenantName)
  await page.getByRole("button", { name: new RegExp(`Create tenant "${escapeRegex(tenantName)}"`) }).click()
  const createTenantDialog = page.getByRole("dialog", { name: "Create tenant" })
  await expect(createTenantDialog).toBeVisible()
  await page.getByRole("button", { name: /^Create tenant$/ }).click()
  await expect(tenantLookup).toHaveValue(tenantCode)

  await page.getByLabel("Clear selection").last().click()
  await expect(tenantLookup).toHaveValue("")
  await expect(page.getByRole("listbox")).toBeVisible()
  await tenantLookup.fill(tenantName)
  await page.getByRole("option", { name: new RegExp(escapeRegex(tenantCode), "i") }).click()
  await expect(tenantLookup).toHaveValue(tenantCode)

  await page.getByRole("combobox", { name: "Billing cycle" }).click()
  await page.getByRole("option", { name: "Monthly" }).click()
  await page.getByRole("combobox", { name: "Currency" }).click()
  await page.getByRole("option", { name: "INR" }).click()
  await page.getByRole("combobox", { name: "Status" }).click()
  await page.getByRole("option", { name: "Active", exact: true }).click()

  await page.getByRole("button", { name: "Start date" }).click()
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible()
  await page.locator("[data-day]").first().click()
  await page.getByRole("button", { name: "Renewal date" }).click()
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible()
  await page.locator("[data-day]").last().click()

  const numberInputs = page.locator("input[type='number']")
  await numberInputs.nth(0).fill("25")
  await numberInputs.nth(1).fill("2500")
  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("heading", { name: planName })).toBeVisible()
  await expect(page.getByText(tenantCode, { exact: true }).first()).toBeVisible()

  await page.reload()
  await expect(page.getByRole("heading", { name: "Subscriptions" })).toBeVisible()
  await expect(page.getByRole("button", { name: planName, exact: true })).toBeVisible()
  await expect(page.getByText(tenantCode, { exact: true }).first()).toBeVisible()

  expect(browserErrors).toEqual([])
})

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
