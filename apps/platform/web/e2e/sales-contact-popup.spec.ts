import { expect, test, type Locator, type Page } from "@playwright/test"

const apiBaseUrl = "http://127.0.0.1:5510"

test("sales popup creates a customer contact from the frontend", async ({ page }) => {
  test.setTimeout(120_000)
  const browserErrors: string[] = []
  collectBrowserErrors(page, browserErrors)
  const suffix = Date.now()
  const customerName = `E2E Sales Customer ${suffix}`

  await loginAsTenant(page)
  await page.goto("/tenant/entries/sales")
  await expect(page.getByRole("heading", { name: "Sales" })).toBeVisible()
  await page.getByRole("button", { name: /^New/i }).click()
  await expect(page.getByRole("heading", { name: "New Sales" })).toBeVisible()

  await page.getByLabel("Customer name *").fill(customerName)
  await page.getByRole("button", { name: `Create contact "${customerName}"` }).click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("heading", { name: "Create contact" })).toBeVisible()
  await expect(dialog.getByLabel("Customer name *")).toHaveValue(customerName)
  await expect(dialog.getByLabel("Legal name")).not.toHaveValue("")
  await expect(dialog.getByText("Something went wrong")).toHaveCount(0)

  const saveResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/core/contacts") && response.request().method() === "POST",
  )
  await dialog.getByRole("button", { name: "Save contact" }).click()
  const saveResponse = await saveResponsePromise
  const saveBody = await saveResponse.text()
  expect(saveResponse.status(), saveBody).toBe(200)

  await expect(dialog).toBeHidden()
  await expect(page.getByLabel("Customer name *")).toHaveValue(customerName)
  await expectApiContains(page, "/core/contacts", "name", customerName)
  await page.getByLabel(`Edit contact ${customerName}`).click()
  await expect(page).toHaveURL(/\/tenant\/master\/contacts\?edit=/)
  await expect(page.getByRole("heading", { name: "Edit contact" })).toBeVisible()
  await expect(page.locator(`input[value="${customerName}"]`)).toBeVisible()
  expect(browserErrors).toEqual([])
})

test("sales popup creates a product with inline lookup masters", async ({ page }) => {
  test.setTimeout(120_000)
  const browserErrors: string[] = []
  collectBrowserErrors(page, browserErrors)
  const suffix = Date.now()
  const productName = `E2E Sales Product ${suffix}`
  const productTypeName = `E2E Product Type ${suffix}`
  const hsnCode = `998${String(suffix).slice(-3)}`
  const unitName = `E2E Unit ${String(suffix).slice(-5)}`
  const gstRate = "18"

  await loginAsTenant(page)
  await page.goto("/tenant/entries/sales")
  await expect(page.getByRole("heading", { name: "Sales" })).toBeVisible()
  await page.getByRole("button", { name: /^New/i }).click()
  await expect(page.getByRole("heading", { name: "New Sales" })).toBeVisible()

  await page.getByLabel("Product name").fill(productName)
  await page.getByRole("button", { name: `Create product "${productName}"` }).click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("heading", { name: "Create product" })).toBeVisible()
  await expect(dialog.getByLabel("Name *")).toHaveValue(productName)
  await dialog.getByRole("textbox", { name: "Code" }).fill(`E2E-PROD-${suffix}`)

  await createInlineLookup(page, dialog, "Search product type", productTypeName)
  await createInlineLookup(page, dialog, "Search hsn code", hsnCode)
  await createInlineLookup(page, dialog, "Search unit", unitName)
  await createInlineLookup(page, dialog, "Search gst %", gstRate)

  const saveResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/core/products") && response.request().method() === "POST",
  )
  await dialog.getByRole("button", { name: "Save" }).click()
  const saveResponse = await saveResponsePromise
  const saveBody = await saveResponse.text()
  expect(saveResponse.status(), saveBody).toBe(200)

  await expect(dialog).toBeHidden()
  await expect(page.getByLabel("Product name")).toHaveValue(productName)
  await page.getByRole("button", { name: /^Add$/ }).click()
  await expect(page.getByRole("cell", { name: productName })).toBeVisible()
  await expect(page.getByRole("cell", { name: hsnCode })).toBeVisible()
  await expect(page.getByRole("cell", { name: unitName })).toBeVisible()
  await expect(page.getByRole("cell", { name: `${gstRate}%` })).toBeVisible()
  await expectApiContains(page, "/core/products", "name", productName)
  expect(browserErrors).toEqual([])
})

test("sales invoice number follows document settings and advances after save", async ({ page }) => {
  test.setTimeout(120_000)
  const browserErrors: string[] = []
  collectBrowserErrors(page, browserErrors)
  const suffix = Date.now()
  const prefix = `E2ES${suffix}`
  const firstNo = `${prefix}-0777`
  const secondNo = `${prefix}-0778`

  await loginAsTenant(page)
  await page.evaluate(
    ({ prefix }) => {
      localStorage.setItem(
        "codexsun_document_settings",
        JSON.stringify([
          { kind: "quotation", label: "Quotation", prefix: "QUO", nextNumber: "1", suffix: "", padding: "4", enabled: true },
          { kind: "sales", label: "Sales", prefix, nextNumber: "777", suffix: "", padding: "4", enabled: true },
          { kind: "exportSales", label: "Export Sales", prefix: "EXP", nextNumber: "1", suffix: "", padding: "4", enabled: true },
          { kind: "purchase", label: "Purchase", prefix: "PUR", nextNumber: "1", suffix: "", padding: "4", enabled: true },
          { kind: "receipt", label: "Receipt", prefix: "REC", nextNumber: "1", suffix: "", padding: "4", enabled: true },
          { kind: "payment", label: "Payment", prefix: "PAY", nextNumber: "1", suffix: "", padding: "4", enabled: true },
          { kind: "cashBook", label: "Cash Book", prefix: "CB", nextNumber: "1", suffix: "", padding: "4", enabled: true },
          { kind: "bankBook", label: "Bank Book", prefix: "BB", nextNumber: "1", suffix: "", padding: "4", enabled: true },
        ]),
      )
    },
    { prefix },
  )
  await page.goto("/tenant/entries/sales")
  await page.getByRole("button", { name: /^New/i }).click()
  await expect(page.getByLabel("Invoice no")).toHaveValue(firstNo)

  await page.getByLabel("Customer name *").fill(`E2E Invoice Customer ${suffix}`)
  await page.getByLabel("Product name").fill(`E2E Invoice Product ${suffix}`)
  await page.getByLabel("Price").fill("100")
  await page.getByRole("button", { name: /^Add$/ }).click()

  const saveResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/core/entries/sales/upsert") && response.request().method() === "POST",
  )
  await page.getByRole("button", { name: /^Save$/ }).click()
  const saveResponse = await saveResponsePromise
  expect(saveResponse.status(), await saveResponse.text()).toBe(200)
  await expect(page.getByRole("heading", { name: new RegExp(firstNo) })).toBeVisible()

  await page.goto("/tenant/settings/document-settings")
  const salesSettingsRow = page.getByRole("row").filter({ has: page.getByText("Sales", { exact: true }) })
  await expect(salesSettingsRow.locator("input").nth(1)).toHaveValue("778")

  await page.goto("/tenant/entries/sales")
  await page.getByRole("button", { name: /^New/i }).click()
  await expect(page.getByLabel("Invoice no")).toHaveValue(secondNo)
  expect(browserErrors).toEqual([])
})

async function createInlineLookup(page: Page, scope: Locator, placeholder: string, value: string) {
  const input = scope.getByPlaceholder(placeholder)
  await input.fill(value)
  await page.getByRole("button", { name: `Create "${value}"` }).click()
  await expect(input).toHaveValue(placeholder === "Search gst %" ? `${value}%` : value)
}

async function loginAsTenant(page: Page) {
  await waitForApiReady(page)
  await page.goto("/login")
  await page.getByLabel("Email").fill("admin@tenant.com")
  await page.getByLabel("Password").fill("admin@123")
  await page.getByLabel("Tenant code").fill("test")
  await page.getByRole("button", { name: /Sign in/i }).click()
  await expect(page.getByRole("heading", { name: "Application Desk" })).toBeVisible()
}

async function waitForApiReady(page: Page) {
  await expect
    .poll(
      async () => {
        try {
          const response = await page.request.get(`${apiBaseUrl}/health`)
          return response.ok()
        } catch {
          return false
        }
      },
      { timeout: 90_000 },
    )
    .toBe(true)
}

async function expectApiContains(page: Page, path: string, field: string, value: string) {
  const response = await page.request.get(`${apiBaseUrl}${path}`, { headers: await tenantHeaders(page) })
  expect(response.status(), await response.text()).toBe(200)
  const body = await response.json()
  const records = Array.isArray(body.data) ? body.data : []
  expect(records.some((record: Record<string, unknown>) => String(record[field] ?? "") === value)).toBe(true)
}

async function tenantHeaders(page: Page) {
  const sessionToken = await page.evaluate(() => localStorage.getItem("codexsun_session_tenant") ?? "")
  const tenantId = await page.evaluate(() => localStorage.getItem("codexsun_tenant_id") ?? "tenant_test_001")
  return {
    Authorization: `Bearer ${sessionToken}`,
    "x-tenant-id": tenantId,
  }
}

function collectBrowserErrors(page: Page, browserErrors: string[]) {
  page.on("pageerror", (error) => browserErrors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
}
