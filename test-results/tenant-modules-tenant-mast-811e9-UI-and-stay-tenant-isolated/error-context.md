# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tenant-modules.spec.ts >> tenant master and common modules save through UI and stay tenant-isolated
- Location: apps\platform\web\e2e\tenant-modules.spec.ts:104:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /^New/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /^New/i })

```

```yaml
- list:
  - listitem:
    - link "Select Company Select Company FY 2026-27":
      - /url: /app
      - img "Select Company"
      - text: Select Company FY 2026-27
- list:
  - listitem:
    - button "Overview"
  - listitem:
    - button "Foundation"
  - listitem:
    - button "Master"
  - listitem:
    - button "Common" [expanded]
    - list:
      - listitem:
        - button "Location" [expanded]
        - list:
          - listitem:
            - button "Countries"
          - listitem:
            - button "States"
          - listitem:
            - button "Districts"
          - listitem:
            - button "Cities"
          - listitem:
            - button "Pincodes"
      - listitem:
        - button "Contacts"
      - listitem:
        - button "Product"
      - listitem:
        - button "Orders"
      - listitem:
        - button "Others"
  - listitem:
    - button "Business"
  - listitem:
    - button "Platform Apps"
- text: v 1.0.2
- list:
  - listitem:
    - button "A ADMIN admin@tenant.com"
- button "Toggle Sidebar"
- main:
  - button "Toggle Sidebar"
  - button "Common"
  - text: Common
  - button "Desk tools"
  - button "Notifications": "3"
  - link "Home":
    - /url: /app
  - link "Logout":
    - /url: /login
  - button "Theme"
  - heading "Common Module Index" [level=1]
  - paragraph: Browse and manage common master data definitions grouped by category.
  - heading "Location" [level=2]
  - button "Countries Country lookup data"
  - button "States State/region lookup"
  - button "Districts District lookup"
  - button "Cities City/town lookup"
  - button "Pincodes Postal code lookup"
  - heading "Contacts" [level=2]
  - button "Contact Groups Grouping labels for contacts"
  - button "Contact Types Customer, supplier, transporter, etc."
  - button "Address Types Billing, shipping, office, warehouse"
  - button "Bank Names Bank name lookup"
  - button "Bank Account Types Current, CC, OD, savings, and other bank account types"
  - heading "Product" [level=2]
  - button "Product Groups Product group definitions"
  - button "Product Categories Product category definitions"
  - button "Product Types Product type definitions"
  - button "Units Pieces, kg, meter, box"
  - button "HSN Codes HSN code lookup"
  - button "Taxes Tax rate definitions"
  - button "Brands Brand name lookup"
  - button "Colours Colour lookup"
  - button "Sizes Size lookup"
  - button "Styles Style lookup"
  - heading "Orders" [level=2]
  - button "Order Types Order type definitions"
  - button "Transports Transport mode lookup"
  - button "Warehouses Warehouse definitions"
  - button "Destinations Destination lookup"
  - button "Stock Rejection Types Rejection reason codes"
  - heading "Others" [level=2]
  - button "Currencies Currency codes"
  - button "Priorities Priority levels"
  - button "Payment Terms Payment term definitions"
  - button "Accounting Year Financial year periods"
  - button "Months Month definitions"
  - button "Sales Account Types Sales account categories"
- region "Notifications alt+T"
```

# Test source

```ts
  136 |       name,
  137 |       path: routeForCommonModule(key),
  138 |     })
  139 |     await expectApiContains(page, `/core/common/records?definitionKey=${key}`, displayFieldForCommon(key), name)
  140 |     await expectTenantMismatchBlocked(page, `/core/common/records?definitionKey=${key}`)
  141 |     if (key === "countries") {
  142 |       await forceDeleteCommonRecord(page, name)
  143 |       await expectApiNotContains(page, `/core/common/records?definitionKey=${key}`, displayFieldForCommon(key), name)
  144 |     }
  145 |   }
  146 | 
  147 |   expect(browserErrors).toEqual([])
  148 | })
  149 | 
  150 | test("application modules save through UI and keep application desk behaviour", async ({ page }) => {
  151 |   test.setTimeout(90_000)
  152 |   const browserErrors: string[] = []
  153 |   const suffix = Date.now()
  154 |   collectBrowserErrors(page, browserErrors)
  155 | 
  156 |   await loginAsTenant(page)
  157 | 
  158 |   const companyName = `E2E Company ${suffix}`
  159 |   await createApplicationCompany(page, {
  160 |     industry: `E2E Industry ${suffix}`,
  161 |     legalName: companyName,
  162 |     tradeName: `E2E Trade ${suffix}`,
  163 |   })
  164 |   await expectApiContains(page, "/core/companies", "legalName", companyName)
  165 |   await expectTenantMismatchBlocked(page, "/core/companies")
  166 |   await switchDefaultCompany(page, {
  167 |     accountingYear: "FY 2026-27",
  168 |     companyName: `E2E Trade ${suffix}`,
  169 |   })
  170 | 
  171 |   const accountingYearName = `E2E Accounting Year ${suffix}`
  172 |   await createApplicationAccountingYear(page, {
  173 |     code: `AY-${suffix}`,
  174 |     name: accountingYearName,
  175 |   })
  176 |   await page.reload()
  177 |   await expect(page.getByRole("row").filter({ hasText: accountingYearName })).toBeVisible()
  178 | 
  179 |   const roleName = `E2E Role ${suffix}`
  180 |   await createApplicationRole(page, {
  181 |     code: `ROLE-${suffix}`,
  182 |     name: roleName,
  183 |   })
  184 |   await page.reload()
  185 |   await expect(page.getByRole("row").filter({ hasText: roleName })).toBeVisible()
  186 | 
  187 |   const userName = `E2E User ${suffix}`
  188 |   await createApplicationUser(page, {
  189 |     email: `user-${suffix}@example.com`,
  190 |     mobile: `+91${String(suffix).slice(-10)}`,
  191 |     name: userName,
  192 |     roleName,
  193 |   })
  194 |   await page.reload()
  195 |   await expect(page.getByRole("row").filter({ hasText: userName })).toBeVisible()
  196 | 
  197 |   await updateApplicationSettings(page, `APP-${suffix}`)
  198 |   await expect(page.getByRole("button", { name: "Reset" })).toBeVisible()
  199 | 
  200 |   await page.goto("/app/permissions")
  201 |   await expect(page.getByRole("heading", { name: "Permissions" })).toBeVisible()
  202 |   await expect(page.getByRole("row").filter({ hasText: "Manage company" })).toContainText(roleName)
  203 | 
  204 |   await page.goto("/app/landing")
  205 |   await expect(page.getByRole("heading", { name: "Landing Desk" })).toBeVisible()
  206 |   await expect(page.getByRole("link", { name: /^Company\b/i })).toBeVisible()
  207 | 
  208 |   expect(browserErrors).toEqual([])
  209 | })
  210 | 
  211 | async function loginAsTenant(page: Page) {
  212 |   await page.goto("/login")
  213 |   await page.getByLabel("Email").fill("admin@tenant.com")
  214 |   await page.getByLabel("Password").fill("admin@123")
  215 |   await page.getByLabel("Tenant code").fill("test")
  216 |   await page.getByRole("button", { name: /Sign in/i }).click()
  217 |   await expect(page.getByRole("heading", { name: "Application Desk" })).toBeVisible()
  218 |   await expect(page.getByText("Shared workspace, company setup, roles")).toBeVisible()
  219 | }
  220 | 
  221 | function routeForCommonModule(key: string) {
  222 |   return ["countries", "states", "districts", "cities", "pincodes", "destinations"].includes(key)
  223 |     ? `/tenant/common/locations/${key}`
  224 |     : `/tenant/common/${key}`
  225 | }
  226 | 
  227 | function displayFieldForCommon(key: string) {
  228 |   return key === "hsn-codes" || key === "taxes" ? "description" : "name"
  229 | }
  230 | 
  231 | async function createTenantRecord(
  232 |   page: Page,
  233 |   input: { code: string; name: string; path: string },
  234 | ) {
  235 |   await page.goto(input.path)
> 236 |   await expect(page.getByRole("button", { name: /^New/i })).toBeVisible()
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  237 |   await page.getByRole("button", { name: /^New/i }).click()
  238 |   await expect(page.locator("form")).toBeVisible()
  239 | 
  240 |   const form = page.locator("form")
  241 |   const inputs = form.locator("input:not([type='checkbox'])")
  242 |   if (input.path.includes("/contacts")) {
  243 |     await inputs.nth(0).fill(input.name)
  244 |     await inputs.nth(1).fill(input.code)
  245 |     await inputs.nth(2).fill(input.name)
  246 |     const contactType = `E2E Contact Type ${input.code}`
  247 |     await inputs.nth(3).fill(contactType)
  248 |     await page.getByRole("button", { name: `Create "${contactType}"` }).click()
  249 |     await expect(inputs.nth(3)).toHaveValue(contactType)
  250 |     await inputs.nth(4).fill("0")
  251 |     await inputs.nth(5).fill("0")
  252 |     await page.getByRole("button", { name: /^Save$/ }).click()
  253 |     await expect(page.getByText(input.name).first()).toBeVisible()
  254 |     return
  255 |   }
  256 |   const inputCount = await inputs.count()
  257 |   for (let index = 0; index < inputCount; index += 1) {
  258 |     const textbox = inputs.nth(index)
  259 |     const value = valueForInput({ index, input })
  260 |     await textbox.fill(value)
  261 |   }
  262 |   await page.getByRole("button", { name: /^Save$/ }).click()
  263 | 
  264 |   await expect(page.getByText(input.name).first()).toBeVisible()
  265 | }
  266 | 
  267 | async function createApplicationCompany(
  268 |   page: Page,
  269 |   input: { industry: string; legalName: string; tradeName: string },
  270 | ) {
  271 |   await page.goto("/app/company")
  272 |   await expect(page.getByRole("button", { name: /^New company$/i })).toBeVisible()
  273 |   await page.getByRole("button", { name: /^New company$/i }).click()
  274 |   await expect(page.getByRole("heading", { name: "New company" })).toBeVisible()
  275 | 
  276 |   let inputs = activePanelInputs(page)
  277 |   await inputs.nth(0).fill(input.legalName)
  278 |   await inputs.nth(1).fill(input.tradeName)
  279 |   await inputs.nth(2).fill("33ABCDE1234F1Z5")
  280 |   await inputs.nth(4).fill(input.industry)
  281 | 
  282 |   await page.getByRole("tab", { name: "Tax Details" }).click()
  283 |   inputs = activePanelInputs(page)
  284 |   await inputs.nth(0).fill("MSME12345")
  285 |   await inputs.nth(1).fill("ABCDE1234F")
  286 |   await inputs.nth(2).fill("ABCD12345E")
  287 | 
  288 |   await page.getByRole("tab", { name: "Communication" }).click()
  289 |   inputs = activePanelInputs(page)
  290 |   await inputs.nth(0).fill(`company-${Date.now()}@example.com`)
  291 |   await inputs.nth(1).fill("+91-9876543210")
  292 |   await page.getByRole("button", { name: /^Add$/ }).first().click()
  293 |   inputs = activePanelInputs(page)
  294 |   await inputs.nth(1).fill(`accounts-${Date.now()}@example.com`)
  295 |   await page.getByRole("button", { name: /^Add$/ }).nth(1).click()
  296 |   inputs = activePanelInputs(page)
  297 |   await inputs.nth(3).fill("+91-9876500000")
  298 | 
  299 |   await page.getByRole("tab", { name: "Addresses" }).click()
  300 |   inputs = activePanelInputs(page)
  301 |   await inputs.nth(0).fill("Line 1")
  302 |   await inputs.nth(2).fill("India")
  303 |   await inputs.nth(5).fill("Chennai")
  304 |   await inputs.nth(6).fill("600001")
  305 |   await page.getByRole("button", { name: /^Add$/ }).click()
  306 |   inputs = activePanelInputs(page)
  307 |   await inputs.nth(7).fill("Branch line 1")
  308 |   await inputs.nth(9).fill("India")
  309 |   await inputs.nth(12).fill("Coimbatore")
  310 |   await inputs.nth(13).fill("641001")
  311 | 
  312 |   await page.getByRole("tab", { name: "Finance" }).click()
  313 |   inputs = activePanelInputs(page)
  314 |   await inputs.nth(0).fill("State Bank")
  315 |   await inputs.nth(1).fill("1234567890")
  316 |   const accountType = `Current Account ${Date.now()}`
  317 |   await inputs.nth(2).fill(accountType)
  318 |   await page.getByRole("button", { name: `Create "${accountType}"` }).click()
  319 |   await inputs.nth(3).fill(input.legalName)
  320 |   await inputs.nth(4).fill("SBIN0000001")
  321 | 
  322 |   await page.getByRole("tab", { name: "Logo" }).click()
  323 |   inputs = activePanelInputs(page)
  324 |   await inputs.nth(0).fill("https://example.com/logo.png")
  325 | 
  326 |   await page.getByRole("tab", { name: "More" }).click()
  327 |   inputs = activePanelInputs(page)
  328 |   await inputs.nth(0).fill("https://example.com")
  329 |   await inputs.nth(1).fill("https://linkedin.com/company/e2e")
  330 | 
  331 |   await page.getByRole("button", { name: /^Save$/ }).click()
  332 |   await expect(page.getByRole("row").filter({ hasText: input.legalName })).toBeVisible()
  333 | }
  334 | 
  335 | async function createApplicationLocalRecord(
  336 |   page: Page,
```