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

const commonSeedModules = [
  ...commonModules,
  "company-groups",
  "address-book",
  "contact-emails",
  "contact-phones",
  "contact-social-links",
  "contact-bank-accounts",
  "contact-gst-details",
  "company-logos",
  "company-emails",
  "company-phones",
  "company-social-links",
  "company-bank-accounts",
  "work-orders",
  "sales",
  "quotations",
  "purchases",
  "receipts",
  "payments",
  "purchase-receipts",
  "delivery-notes",
  "stock-ledger",
  "mail",
  "tasks",
  "media-assets",
  "site-sliders",
  "blog",
  "company-settings",
  "document-settings",
]

const registryRoutes = [
  ["/tenant/foundation/users", "Users"],
  ["/tenant/foundation/rbac-roles", "Roles"],
  ["/tenant/foundation/rbac-policies", "Permissions"],
  ["/tenant/foundation/rbac-role-policies", "Permissions"],
  ["/tenant/foundation/accounting-years", "Accounting Year"],
  ["/tenant/foundation/default-companies", "Default Company"],
  ["/tenant/foundation/address-book", "Address Book"],
  ["/tenant/master/contacts", "Contacts"],
  ["/tenant/master/contacts/contact-emails", "Contact Emails"],
  ["/tenant/master/contacts/contact-phones", "Contact Phones"],
  ["/tenant/master/contacts/contact-social-links", "Contact Social Links"],
  ["/tenant/master/contacts/contact-bank-accounts", "Contact Bank Accounts"],
  ["/tenant/master/contacts/contact-gst-details", "Contact GST Details"],
  ["/tenant/master/companies", "Company"],
  ["/tenant/master/companies/company-logos", "Company Logos"],
  ["/tenant/master/companies/company-emails", "Company Emails"],
  ["/tenant/master/companies/company-phones", "Company Phones"],
  ["/tenant/master/companies/company-social-links", "Company Social Links"],
  ["/tenant/master/companies/company-bank-accounts", "Company Bank Accounts"],
  ["/tenant/master/products", "Products"],
  ["/tenant/master/products/product-groups", "Product Groups"],
  ["/tenant/master/products/product-categories", "Product Categories"],
  ["/tenant/master/products/product-types", "Product Types"],
  ["/tenant/master/products/units", "Units"],
  ["/tenant/master/products/hsn-codes", "HSN Codes"],
  ["/tenant/master/products/taxes", "Taxes"],
  ["/tenant/master/products/brands", "Brands"],
  ["/tenant/master/products/colours", "Colours"],
  ["/tenant/master/products/sizes", "Sizes"],
  ["/tenant/master/products/styles", "Styles"],
  ["/tenant/master/work-orders", "Work Orders"],
  ["/tenant/settings/sales-settings", "Sales Settings"],
  ["/tenant/settings/document-settings", "Document Settings"],
  ["/tenant/settings/accounting-year", "Accounting Year"],
  ["/tenant/common/locations", "Common Module Index"],
  ["/tenant/common/locations/countries", "Countries"],
  ["/tenant/common/locations/states", "States"],
  ["/tenant/common/locations/districts", "Districts"],
  ["/tenant/common/locations/cities", "Cities"],
  ["/tenant/common/locations/pincodes", "Pincodes"],
  ["/tenant/common/contact-groups", "Contact Groups"],
  ["/tenant/common/contact-types", "Contact Types"],
  ["/tenant/common/address-types", "Address Types"],
  ["/tenant/common/bank-names", "Bank Names"],
  ["/tenant/common/order-types", "Order Types"],
  ["/tenant/common/transports", "Transports"],
  ["/tenant/common/warehouses", "Warehouses"],
] as const

test("tenant registry routes open wired frontend modules", async ({ page }) => {
  test.setTimeout(120_000)
  const browserErrors: string[] = []
  collectBrowserErrors(page, browserErrors)

  await loginAsTenant(page)

  for (const [path, heading] of registryRoutes) {
    await page.goto(path)
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible()
  }

  await expect(page.getByRole("button", { name: "Foundation" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Master" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Common" }).first()).toBeVisible()
  await page.goto("/tenant/settings/sales-settings")
  await expect(page.getByRole("button", { name: "Settings" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Sales Settings" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Document Settings" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Accounting Year" }).first()).toBeVisible()
  await page.goto("/tenant/master/products")
  await expect(page.getByRole("button", { name: "Products" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Product Groups" })).toHaveCount(0)
  await page.goto("/tenant/master/work-orders")
  await page.getByRole("button", { name: /^New/i }).click()
  await page.getByRole("button", { name: /^Save$/ }).click()
  await expect(page.getByRole("alert").filter({ hasText: "Required fields" })).toBeVisible()
  await expect(page.getByText("Code is required")).toBeVisible()
  await expect(page.getByText("Name is required")).toBeVisible()
  await expect(page.locator("input[aria-invalid='true']")).toHaveCount(2)
  await expect(page.getByRole("heading", { name: "Status" })).toHaveCount(0)
  expect(browserErrors).toEqual([])
})

test("tenant master and common modules save through UI and stay tenant-isolated", async ({ page }) => {
  test.setTimeout(180_000)
  const browserErrors: string[] = []
  const suffix = Date.now()
  collectBrowserErrors(page, browserErrors)

  await loginAsTenant(page)
  await expectCommonDefaultSeeds(page)

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
      path: routeForCommonModule(key),
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
  await waitForApiReady(page)
  await page.goto("/login")
  await page.getByLabel("Email").fill("admin@tenant.com")
  await page.getByLabel("Password").fill("admin@123")
  await page.getByLabel("Tenant code").fill("test")
  await page.getByRole("button", { name: /Sign in/i }).click()
  await expect(page.getByRole("heading", { name: "Application Desk" })).toBeVisible()
  await expect(page.getByText("Shared workspace, company setup, roles")).toBeVisible()
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
      { timeout: 90_000 }
    )
    .toBe(true)
}

function routeForCommonModule(key: string) {
  return ["countries", "states", "districts", "cities", "pincodes", "destinations"].includes(key)
    ? `/tenant/common/locations/${key}`
    : `/tenant/common/${key}`
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
    await page.getByRole("tab", { name: "Addresses" }).click()
    const addressInputs = activePanelInputs(page)
    await addressInputs.nth(1).fill("Contact line 1")
    await createLookupValue(page, addressInputs.nth(3), `Contact Country ${input.code}`)
    await createLookupValue(page, addressInputs.nth(4), `Contact State ${input.code}`)
    await createLookupValue(page, addressInputs.nth(5), `Contact District ${input.code}`)
    await createLookupValue(page, addressInputs.nth(6), `Contact City ${input.code}`)
    await createLookupValue(page, addressInputs.nth(7), `60${Date.now().toString().slice(-4)}`)
    await page.getByRole("button", { name: /^Save$/ }).click()
    await expect(page.getByText(input.name).first()).toBeVisible()
    return
  }
  if (input.path.includes("/products")) {
    await inputs.nth(0).fill(input.name)
    await inputs.nth(1).fill(input.code)
    await createLookupValue(page, inputs.nth(2), `Finished Product ${input.code}`)
    await createLookupValue(page, inputs.nth(3), `600${Date.now().toString().slice(-5)}`)
    await createLookupValue(page, inputs.nth(4), `Pcs ${input.code}`)
    await createLookupValue(page, inputs.nth(5), `5.${Date.now().toString().slice(-3)}%`)
    await page.getByRole("tab", { name: "Image" }).click()
    const imageBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#0f766e"/></svg>')
    await page.locator('[role="tabpanel"][data-state="active"] input[type="file"]').setInputFiles({ name: "product.svg", mimeType: "image/svg+xml", buffer: imageBuffer })
    await page.getByRole("tab", { name: "Opening" }).click()
    const openingInputs = activePanelInputs(page)
    await openingInputs.nth(0).fill("12")
    await openingInputs.nth(1).fill("99.50")
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

  await expectCreatedRecordVisible(page, input.name)
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
  const companyLocationSuffix = Date.now().toString()
  await createLookupValue(page, inputs.nth(2), `Company Country ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(3), `Company State ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(4), `Company District ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(5), `Company City ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(6), `61${companyLocationSuffix.slice(-4)}`)
  await page.getByRole("button", { name: /^Add$/ }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(7).fill("Branch line 1")
  await createLookupValue(page, inputs.nth(9), `Branch Country ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(10), `Branch State ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(11), `Branch District ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(12), `Branch City ${companyLocationSuffix}`)
  await createLookupValue(page, inputs.nth(13), `62${companyLocationSuffix.slice(-4)}`)

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
  const logoInputs = page.locator('[role="tabpanel"][data-state="active"] input[type="file"]')
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#111"/></svg>')
  await logoInputs.nth(0).setInputFiles({ name: "logo.svg", mimeType: "image/svg+xml", buffer: svgBuffer })
  await logoInputs.nth(1).setInputFiles({ name: "logo-dark.svg", mimeType: "image/svg+xml", buffer: svgBuffer })
  await logoInputs.nth(2).setInputFiles({ name: "favicon.svg", mimeType: "image/svg+xml", buffer: svgBuffer })

  await page.getByRole("tab", { name: "More" }).click()
  inputs = activePanelInputs(page)
  await inputs.nth(0).fill("https://example.com")
  await inputs.nth(1).fill("https://linkedin.com/company/e2e")

  const saveResponse = page.waitForResponse((response) => response.url().includes("/core/companies") && response.request().method() === "POST")
  await page.getByRole("button", { name: /^Save$/ }).click()
  const response = await saveResponse
  expect(response.status(), await response.text()).toBe(200)
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
  await page.getByRole("option", { name: input.companyName }).dispatchEvent("click")
  await selects.nth(1).click()
  await page.getByRole("option", { name: input.accountingYear }).dispatchEvent("click")
  await page.getByRole("button", { name: /^Update$/ }).click()
  await expect(page.getByText(input.companyName).first()).toBeVisible()
  await expect(page.getByText(input.accountingYear).first()).toBeVisible()
}

function activePanelInputs(page: Page) {
  return page.locator('[role="tabpanel"][data-state="active"] input:not([type="checkbox"]):not([type="file"])')
}

async function expectCreatedRecordVisible(page: Page, name: string) {
  const row = page.getByRole("row").filter({ hasText: name }).first()
  try {
    await expect(row).toBeVisible({ timeout: 5_000 })
    return
  } catch {}

  const search = page.locator("main input").first()
  await search.fill(name)
  await expect(row).toBeVisible()
}

async function createLookupValue(page: Page, input: ReturnType<Page["locator"]>, value: string) {
  await input.fill(value)
  const createButton = page.getByRole("button", { name: `Create "${value}"` })
  await createButton.click()
  await expect(page.getByRole("button", { name: "Creating..." })).toHaveCount(0)
  await expect(createButton).toHaveCount(0)
  await expect(input).toHaveValue(new RegExp(escapeRegex(value)))
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

async function expectCommonDefaultSeeds(page: Page) {
  const auth = await tenantAuth(page)
  for (const key of commonSeedModules) {
    const response = await page.request.get(`${apiBaseUrl}/core/common/records?definitionKey=${key}`, {
      headers: auth,
    })
    expect(response.status(), await response.text()).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body.data)).toBe(true)
    const first = body.data[0] as Record<string, unknown> | undefined
    expect(first?.id).toBe("common-default-dash")
    expect(first?.name).toBe("-")
    expect(first?.isActive).toBe(true)
    if (key === "countries" || key === "states") {
      expect(first?.code).toBe("-")
    }
    if (key === "states") {
      expect(first?.countryId).toBe("common-default-dash")
    }
    if (key === "districts") {
      expect(first?.stateId).toBe("common-default-dash")
    }
    if (key === "cities") {
      expect(first?.districtId).toBe("common-default-dash")
    }
    if (key === "hsn-codes" || key === "taxes") {
      expect(first?.description).toBe("-")
    }
  }
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
