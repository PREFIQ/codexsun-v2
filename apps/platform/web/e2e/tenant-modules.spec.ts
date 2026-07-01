import { expect, test, type Page } from "@playwright/test"

const apiBaseUrl = "http://127.0.0.1:5510"

const commonModules = [
  "countries",
  "states",
  "districts",
  "cities",
  "pincodes",
  "contact-groups",
  "contact-types",
  "address-types",
  "bank-names",
  "bank-account-types",
  "product-groups",
  "product-categories",
  "product-types",
  "units",
  "hsn-codes",
  "taxes",
  "brands",
  "colours",
  "sizes",
  "styles",
  "order-types",
  "transports",
  "warehouses",
  "destinations",
  "stock-rejection-types",
  "currencies",
  "priorities",
  "payment-terms",
  "accounting-year",
  "months",
  "sales-account-types",
]

test("tenant master and common modules save through UI and stay tenant-isolated", async ({ page }) => {
  test.setTimeout(180_000)
  const browserErrors: string[] = []
  const suffix = Date.now()
  collectBrowserErrors(page, browserErrors)

  await loginAsTenant(page)

  await createTenantRecord(page, {
    code: `CON-${suffix}`,
    name: `E2E Contact ${suffix}`,
    path: "/app/contacts",
  })
  await expectApiContains(page, "/core/contacts", "name", `E2E Contact ${suffix}`)
  await expectTenantMismatchBlocked(page, "/core/contacts")

  await createTenantRecord(page, {
    code: `PRD-${suffix}`,
    name: `E2E Product ${suffix}`,
    path: "/app/products",
  })
  await expectApiContains(page, "/core/products", "name", `E2E Product ${suffix}`)
  await expectTenantMismatchBlocked(page, "/core/products")

  for (const key of commonModules) {
    const label = key
      .split("-")
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ")
    const name = `E2E ${label} ${suffix}`
    await createTenantRecord(page, {
      code: `${key.slice(0, 8).toUpperCase()}-${suffix}`,
      name,
      path: key === "accounting-year" ? "/app/common-accounting-year" : `/app/${key}`,
    })
    await expectApiContains(page, `/core/common/records?definitionKey=${key}`, displayFieldForCommon(key), name)
    await expectTenantMismatchBlocked(page, `/core/common/records?definitionKey=${key}`)
    if (key === "countries") {
      await forceDeleteCommonRecord(page, name)
      await expectApiNotContains(page, `/core/common/records?definitionKey=${key}`, displayFieldForCommon(key), name)
    }
  }

  expect(browserErrors).toEqual([])
})

test("application modules save through UI and keep application desk behaviour", async ({ page }) => {
  test.setTimeout(90_000)
  const browserErrors: string[] = []
  const suffix = Date.now()
  collectBrowserErrors(page, browserErrors)

  await loginAsTenant(page)

  const companyName = `E2E Company ${suffix}`
  await createApplicationCompany(page, {
    industry: `E2E Industry ${suffix}`,
    legalName: companyName,
    tradeName: `E2E Trade ${suffix}`,
  })
  await expectApiContains(page, "/core/companies", "legalName", companyName)
  await expectTenantMismatchBlocked(page, "/core/companies")
  await switchDefaultCompany(page, {
    accountingYear: "FY 2026-27",
    companyName: `E2E Trade ${suffix}`,
  })

  const accountingYearName = `E2E Accounting Year ${suffix}`
  await createApplicationAccountingYear(page, {
    code: `AY-${suffix}`,
    name: accountingYearName,
  })
  await page.reload()
  await expect(page.getByRole("row").filter({ hasText: accountingYearName })).toBeVisible()

  const roleName = `E2E Role ${suffix}`
  await createApplicationRole(page, {
    code: `ROLE-${suffix}`,
    name: roleName,
  })
  await page.reload()
  await expect(page.getByRole("row").filter({ hasText: roleName })).toBeVisible()

  const userName = `E2E User ${suffix}`
  await createApplicationUser(page, {
    email: `user-${suffix}@example.com`,
    mobile: `+91${String(suffix).slice(-10)}`,
    name: userName,
    roleName,
  })
  await page.reload()
  await expect(page.getByRole("row").filter({ hasText: userName })).toBeVisible()

  await updateApplicationSettings(page, `APP-${suffix}`)
  await expect(page.getByRole("button", { name: "Reset" })).toBeVisible()

  await page.goto("/app/permissions")
  await expect(page.getByRole("heading", { name: "Permissions" })).toBeVisible()
  await expect(page.getByRole("row").filter({ hasText: "Manage company" })).toContainText(roleName)

  await page.goto("/app/landing")
  await expect(page.getByRole("heading", { name: "Landing Desk" })).toBeVisible()
  await expect(page.getByRole("link", { name: /^Company\b/i })).toBeVisible()

  expect(browserErrors).toEqual([])
})

async function loginAsTenant(page: Page) {
  await page.goto("/login")
  await page.getByLabel("Email").fill("admin@tenant.com")
  await page.getByLabel("Password").fill("admin@123")
  await page.getByLabel("Tenant code").fill("test")
  await page.getByRole("button", { name: /Sign in/i }).click()
  await expect(page.getByRole("heading", { name: "Application Desk" })).toBeVisible()
  await expect(page.getByText("Shared workspace, company setup, roles")).toBeVisible()
}

function displayFieldForCommon(key: string) {
  return key === "hsn-codes" || key === "taxes" ? "description" : "name"
}

async function createTenantRecord(
  page: Page,
  input: { code: string; name: string; path: string },
) {
  await page.goto(input.path)
  await expect(page.getByRole("button", { name: /^New/i })).toBeVisible()
  await page.getByRole("button", { name: /^New/i }).click()
  await expect(page.locator("form")).toBeVisible()

  const form = page.locator("form")
  const inputs = form.locator("input:not([type='checkbox'])")
  if (input.path.includes("/contacts")) {
    await inputs.nth(0).fill(input.name)
    await inputs.nth(1).fill(input.code)
    await inputs.nth(2).fill(input.name)
    const contactType = `E2E Contact Type ${input.code}`
    await inputs.nth(3).fill(contactType)
    await page.getByRole("button", { name: `Create "${contactType}"` }).click()
    await expect(inputs.nth(3)).toHaveValue(contactType)
    await inputs.nth(4).fill("0")
    await inputs.nth(5).fill("0")
    await page.getByRole("button", { name: /^Save$/ }).click()
    await expect(page.getByText(input.name).first()).toBeVisible()
    return
  }
  const inputCount = await inputs.count()
  for (let index = 0; index < inputCount; index += 1) {
    const textbox = inputs.nth(index)
    const value = valueForInput({ index, input })
    await textbox.fill(value)
  }
  await page.getByRole("button", { name: /^Save$/ }).click()

  await expect(page.getByText(input.name).first()).toBeVisible()
}

async function createApplicationCompany(
  page: Page,
  input: { industry: string; legalName: string; tradeName: string },
) {
  await page.goto("/app/company")
  await expect(page.getByRole("button", { name: /^New company$/i })).toBeVisible()
  await page.getByRole("button", { name: /^New company$/i }).click()
  await expect(page.getByRole("heading", { name: "New company" })).toBeVisible()

  let inputs = activePanelInputs(page)
  await inputs.nth(0).fill(input.legalName)
  await inputs.nth(1).fill(input.tradeName)
  await inputs.nth(2).fill("33ABCDE1234F1Z5")
  await inputs.nth(4).fill(input.industry)

  await page.getByRole("tab", { name: "Tax Details" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill("MSME12345")
  await inputs.nth(1).fill("ABCDE1234F")
  await inputs.nth(2).fill("ABCD12345E")

  await page.getByRole("tab", { name: "Communication" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill(`company-${Date.now()}@example.com`)
  await inputs.nth(1).fill("+91-9876543210")
  await page.getByRole("button", { name: /^Add$/ }).first().click()
  inputs = activePanelInputs(page)
  await inputs.nth(1).fill(`accounts-${Date.now()}@example.com`)
  await page.getByRole("button", { name: /^Add$/ }).nth(1).click()
  inputs = activePanelInputs(page)
  await inputs.nth(3).fill("+91-9876500000")

  await page.getByRole("tab", { name: "Addresses" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill("Line 1")
  await inputs.nth(2).fill("India")
  await inputs.nth(5).fill("Chennai")
  await inputs.nth(6).fill("600001")
  await page.getByRole("button", { name: /^Add$/ }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(7).fill("Branch line 1")
  await inputs.nth(9).fill("India")
  await inputs.nth(12).fill("Coimbatore")
  await inputs.nth(13).fill("641001")

  await page.getByRole("tab", { name: "Finance" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill("State Bank")
  await inputs.nth(1).fill("1234567890")
  const accountType = `Current Account ${Date.now()}`
  await inputs.nth(2).fill(accountType)
  await page.getByRole("button", { name: `Create "${accountType}"` }).click()
  await inputs.nth(3).fill(input.legalName)
  await inputs.nth(4).fill("SBIN0000001")

  await page.getByRole("tab", { name: "Logo" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill("https://example.com/logo.png")

  await page.getByRole("tab", { name: "More" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill("https://example.com")
  await inputs.nth(1).fill("https://linkedin.com/company/e2e")

  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("row").filter({ hasText: input.legalName })).toBeVisible()
}

async function createApplicationLocalRecord(
  page: Page,
  input: { category: string; code: string; name: string; path: string },
) {
  await page.goto(input.path)
  await expect(page.getByRole("button", { name: /^New/i })).toBeVisible()
  await page.getByRole("button", { name: /^New/i }).click()
  await expect(page.getByRole("heading", { name: new RegExp(`New ${escapeRegex(input.category.toLowerCase())}`) })).toBeVisible()

  if (input.path.includes("/accounting-year")) {
    const accountingInputs = page.locator("input:not([type='checkbox'])")
    await accountingInputs.nth(0).fill(input.name)
    await accountingInputs.nth(1).fill(input.code)
    await accountingInputs.nth(2).fill("2026-04-01")
    await accountingInputs.nth(3).fill("2027-03-31")
    await page.getByRole("button", { name: /^Save$/ }).click()
    await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
    return
  }

  const inputs = activePanelInputs(page)
  await inputs.nth(0).fill(input.name)
  await inputs.nth(1).fill(input.code)
  await inputs.nth(2).fill(input.category)
  if (input.path.includes("/users")) {
    await inputs.nth(3).fill(`user-${Date.now()}@example.com`)
  }

  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
}

async function createApplicationAccountingYear(
  page: Page,
  input: { code: string; name: string },
) {
  await page.goto("/app/accounting-year")
  await expect(page.getByRole("button", { name: /^New/i })).toBeVisible()
  await page.getByRole("button", { name: /^New/i }).click()
  await expect(page.getByRole("heading", { name: /New accounting year/i })).toBeVisible()
  const inputs = page.locator("input:not([type='checkbox'])")
  await inputs.nth(0).fill(input.name)
  await inputs.nth(1).fill(input.code)
  await inputs.nth(2).fill("2027-04-01")
  await inputs.nth(3).fill("2028-03-31")
  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
}

async function createApplicationRole(
  page: Page,
  input: { code: string; name: string },
) {
  await page.goto("/app/roles")
  await expect(page.getByRole("button", { name: /^New role$/i })).toBeVisible()
  await page.getByRole("button", { name: /^New role$/i }).click()
  await expect(page.getByRole("heading", { name: "New role" })).toBeVisible()
  let inputs = activePanelInputs(page)
  await inputs.nth(0).fill(input.name)
  await inputs.nth(1).fill(input.code)
  await page.getByRole("tab", { name: "Permissions" }).click()
  await page.getByRole("button", { name: "Manage company" }).click()
  await page.getByRole("button", { name: "Manage settings" }).click()
  await page.getByRole("button", { name: "Manage masters" }).click()
  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
}

async function createApplicationUser(
  page: Page,
  input: { email: string; mobile: string; name: string; roleName: string },
) {
  await page.goto("/app/users")
  await expect(page.getByRole("button", { name: /^New user$/i })).toBeVisible()
  await page.getByRole("button", { name: /^New user$/i }).click()
  await expect(page.getByRole("heading", { name: "New user" })).toBeVisible()
  const inputs = activePanelInputs(page)
  await inputs.nth(0).fill(input.name)
  await inputs.nth(1).fill(input.email)
  await inputs.nth(2).fill(input.mobile)
  await page.getByRole("combobox").click()
  await page.getByRole("option", { name: input.roleName }).click()
  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
}

async function updateApplicationSettings(page: Page, invoicePrefix: string) {
  await page.goto("/app/settings")
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()
  let inputs = activePanelInputs(page)
  await inputs.nth(0).fill("Application")
  await inputs.nth(1).fill("Asia/Kolkata")
  await page.getByRole("tab", { name: "Security" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill("30")
  await page.getByRole("tab", { name: "Billing" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill(invoicePrefix)
  await page.getByRole("button", { name: /^Save$/ }).click()
}

async function switchDefaultCompany(
  page: Page,
  input: { accountingYear: string; companyName: string },
) {
  await page.goto("/app/default-company")
  await expect(page.getByRole("heading", { name: "Default Company" })).toBeVisible()
  await page.getByRole("button", { name: /^Edit switch$/ }).click()
  const selects = page.getByRole("combobox")
  await selects.nth(0).click()
  await page.getByRole("option", { name: input.companyName }).click()
  await selects.nth(1).click()
  await page.getByRole("option", { name: input.accountingYear }).click()
  await page.getByRole("button", { name: /^Update$/ }).click()
  await expect(page.getByText(input.companyName).first()).toBeVisible()
  await expect(page.getByText(input.accountingYear).first()).toBeVisible()
}

function activePanelInputs(page: Page) {
  return page.locator('[role="tabpanel"][data-state="active"] input:not([type="checkbox"])')
}

function valueForInput({
  index,
  input,
}: {
  index: number
  input: { code: string; name: string }
}) {
  const path = input.path
  if (path.includes("/contacts")) {
    return [input.name, input.code, input.name, "Customer", "0", "0"][index] ?? "1"
  }
  if (path.includes("/products")) {
    return [input.name, input.code, "Product Type", "HSN", "Unit", "18"][index] ?? "1"
  }
  if (path.includes("accounting-year")) {
    return [input.name, "2026-04-01", "2027-03-31", "2026-04-01", "true"][index] ?? "1"
  }
  if (path.includes("countries")) {
    return [input.name, input.code, "+91"][index] ?? "1"
  }
  if (path.includes("states")) {
    return [input.name, input.code, "India"][index] ?? "1"
  }
  if (path.includes("districts")) {
    return [input.name, relatedName(input.name, "States")][index] ?? "1"
  }
  if (path.includes("cities")) {
    return [input.name, relatedName(input.name, "Districts")][index] ?? "1"
  }
  if (path.includes("hsn-codes")) {
    return [input.name, input.code][index] ?? "1"
  }
  if (path.includes("taxes")) {
    return [input.name, "18"][index] ?? "1"
  }
  if (path.includes("priorities")) {
    return [input.name, "#ef4444", "HIGH"][index] ?? "1"
  }
  if (path.includes("transports")) {
    return [input.name, "33ABCDE1234F1Z5", "TN01AB1234", "+91-9876543210", "Manager"][index] ?? "1"
  }
  if (index === 0) return input.name
  if (index === 1) return input.code
  return "1"
}

function relatedName(currentName: string, moduleName: string) {
  const suffix = currentName.match(/(\d+)$/)?.[1] ?? ""
  return `E2E ${moduleName}${suffix ? ` ${suffix}` : ""}`
}

async function expectApiContains(page: Page, path: string, field: string, value: string) {
  const auth = await tenantAuth(page)
  const response = await page.request.get(`${apiBaseUrl}${path}`, {
    headers: auth,
  })
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(Array.isArray(body.data)).toBe(true)
  expect(body.data.some((record: Record<string, unknown>) => record[field] === value)).toBe(true)
}

async function expectApiNotContains(page: Page, path: string, field: string, value: string) {
  const auth = await tenantAuth(page)
  const response = await page.request.get(`${apiBaseUrl}${path}`, {
    headers: auth,
  })
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(Array.isArray(body.data)).toBe(true)
  expect(body.data.some((record: Record<string, unknown>) => record[field] === value)).toBe(false)
}

async function forceDeleteCommonRecord(page: Page, name: string) {
  const row = page.getByRole("row").filter({ hasText: name })
  await expect(row).toBeVisible()
  await row.getByRole("button", { name: `${name} actions` }).click()
  await page.getByRole("menuitem", { name: /Force delete/i }).click()
  const dialog = page.getByRole("dialog")
  await dialog.locator("input").fill(name)
  await dialog.getByRole("button", { name: /^Force delete$/ }).click()
  await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0)
}

async function expectTenantMismatchBlocked(page: Page, path: string) {
  const auth = await tenantAuth(page)
  const response = await page.request.get(`${apiBaseUrl}${path}`, {
    headers: {
      ...auth,
      "x-tenant-id": "999999999",
    },
  })
  expect(response.status()).toBe(403)
}

async function tenantAuth(page: Page) {
  const auth = await page.evaluate(() => ({
    tenantId: localStorage.getItem("codexsun_tenant_id"),
    token: localStorage.getItem("codexsun_session_tenant"),
  }))
  expect(auth.token).toBeTruthy()
  expect(auth.tenantId).toBeTruthy()
  return {
    Authorization: `Bearer ${auth.token}`,
    "x-tenant-id": String(auth.tenantId),
  }
}

function collectBrowserErrors(page: Page, browserErrors: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("pageerror", (error) => browserErrors.push(error.message))
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
