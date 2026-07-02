# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tenant-modules.spec.ts >> application modules save through UI and keep application desk behaviour
- Location: apps\platform\web\e2e\tenant-modules.spec.ts:150:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Settings' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Settings' })

```

```yaml
- list:
  - listitem:
    - link "E2E Trade 1783001335813 E2E Trade 1783001335813 FY 2026-27":
      - /url: /app
      - img "E2E Trade 1783001335813"
      - text: E2E Trade 1783001335813 FY 2026-27
- list:
  - listitem:
    - button "Overview"
  - listitem:
    - button "Foundation"
  - listitem:
    - button "Master"
  - listitem:
    - button "Common"
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
  - button "Foundation"
  - text: Overview
  - button "Desk tools"
  - button "Notifications": "3"
  - link "Home":
    - /url: /app
  - link "Logout":
    - /url: /login
  - button "Theme"
  - paragraph: Application
  - heading "Application Desk" [level=1]
  - paragraph: Shared workspace, company setup, roles, and cross-app launch desk.
  - text: Signed in as ADMIN
  - button "1 Companies"
  - button "1 Default Company"
  - button "1 Accounting Years"
  - button "1 Users"
  - button "3 Roles"
  - button "9 Permissions"
  - button "Ready Settings"
  - button "Company"
  - button "Default Company"
  - button "Accounting Year"
  - button "Settings"
  - button "Users"
  - button "Roles"
  - button "Permissions"
  - button "Landing Desk"
- region "Notifications alt+T"
```

# Test source

```ts
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
  337 |   input: { category: string; code: string; name: string; path: string },
  338 | ) {
  339 |   await page.goto(input.path)
  340 |   await expect(page.getByRole("button", { name: /^New/i })).toBeVisible()
  341 |   await page.getByRole("button", { name: /^New/i }).click()
  342 |   await expect(page.getByRole("heading", { name: new RegExp(`New ${escapeRegex(input.category.toLowerCase())}`) })).toBeVisible()
  343 | 
  344 |   if (input.path.includes("/accounting-year")) {
  345 |     const accountingInputs = page.locator("input:not([type='checkbox'])")
  346 |     await accountingInputs.nth(0).fill(input.name)
  347 |     await accountingInputs.nth(1).fill(input.code)
  348 |     await accountingInputs.nth(2).fill("2026-04-01")
  349 |     await accountingInputs.nth(3).fill("2027-03-31")
  350 |     await page.getByRole("button", { name: /^Save$/ }).click()
  351 |     await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
  352 |     return
  353 |   }
  354 | 
  355 |   const inputs = activePanelInputs(page)
  356 |   await inputs.nth(0).fill(input.name)
  357 |   await inputs.nth(1).fill(input.code)
  358 |   await inputs.nth(2).fill(input.category)
  359 |   if (input.path.includes("/users")) {
  360 |     await inputs.nth(3).fill(`user-${Date.now()}@example.com`)
  361 |   }
  362 | 
  363 |   await page.getByRole("button", { name: /^Save$/ }).click()
  364 |   await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
  365 | }
  366 | 
  367 | async function createApplicationAccountingYear(
  368 |   page: Page,
  369 |   input: { code: string; name: string },
  370 | ) {
  371 |   await page.goto("/app/accounting-year")
  372 |   await expect(page.getByRole("button", { name: /^New/i })).toBeVisible()
  373 |   await page.getByRole("button", { name: /^New/i }).click()
  374 |   await expect(page.getByRole("heading", { name: /New accounting year/i })).toBeVisible()
  375 |   const inputs = page.locator("input:not([type='checkbox'])")
  376 |   await inputs.nth(0).fill(input.name)
  377 |   await inputs.nth(1).fill(input.code)
  378 |   await inputs.nth(2).fill("2027-04-01")
  379 |   await inputs.nth(3).fill("2028-03-31")
  380 |   await page.getByRole("button", { name: /^Save$/ }).click()
  381 |   await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
  382 | }
  383 | 
  384 | async function createApplicationRole(
  385 |   page: Page,
  386 |   input: { code: string; name: string },
  387 | ) {
  388 |   await page.goto("/app/roles")
  389 |   await expect(page.getByRole("button", { name: /^New role$/i })).toBeVisible()
  390 |   await page.getByRole("button", { name: /^New role$/i }).click()
  391 |   await expect(page.getByRole("heading", { name: "New role" })).toBeVisible()
  392 |   let inputs = activePanelInputs(page)
  393 |   await inputs.nth(0).fill(input.name)
  394 |   await inputs.nth(1).fill(input.code)
  395 |   await page.getByRole("tab", { name: "Permissions" }).click()
  396 |   await page.getByRole("button", { name: "Manage company" }).click()
  397 |   await page.getByRole("button", { name: "Manage settings" }).click()
  398 |   await page.getByRole("button", { name: "Manage masters" }).click()
  399 |   await page.getByRole("button", { name: /^Save$/ }).click()
  400 |   await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
  401 | }
  402 | 
  403 | async function createApplicationUser(
  404 |   page: Page,
  405 |   input: { email: string; mobile: string; name: string; roleName: string },
  406 | ) {
  407 |   await page.goto("/app/users")
  408 |   await expect(page.getByRole("button", { name: /^New user$/i })).toBeVisible()
  409 |   await page.getByRole("button", { name: /^New user$/i }).click()
  410 |   await expect(page.getByRole("heading", { name: "New user" })).toBeVisible()
  411 |   const inputs = activePanelInputs(page)
  412 |   await inputs.nth(0).fill(input.name)
  413 |   await inputs.nth(1).fill(input.email)
  414 |   await inputs.nth(2).fill(input.mobile)
  415 |   await page.getByRole("combobox").click()
  416 |   await page.getByRole("option", { name: input.roleName }).click()
  417 |   await page.getByRole("button", { name: /^Save$/ }).click()
  418 |   await expect(page.getByRole("row").filter({ hasText: input.name })).toBeVisible()
  419 | }
  420 | 
  421 | async function updateApplicationSettings(page: Page, invoicePrefix: string) {
  422 |   await page.goto("/app/settings")
> 423 |   await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible()
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  424 |   let inputs = activePanelInputs(page)
  425 |   await inputs.nth(0).fill("Application")
  426 |   await inputs.nth(1).fill("Asia/Kolkata")
  427 |   await page.getByRole("tab", { name: "Security" }).click()
  428 |   inputs = activePanelInputs(page)
  429 |   await inputs.nth(0).fill("30")
  430 |   await page.getByRole("tab", { name: "Billing" }).click()
  431 |   inputs = activePanelInputs(page)
  432 |   await inputs.nth(0).fill(invoicePrefix)
  433 |   await page.getByRole("button", { name: /^Save$/ }).click()
  434 | }
  435 | 
  436 | async function switchDefaultCompany(
  437 |   page: Page,
  438 |   input: { accountingYear: string; companyName: string },
  439 | ) {
  440 |   await page.goto("/app/default-company")
  441 |   await expect(page.getByRole("heading", { name: "Default Company" })).toBeVisible()
  442 |   await page.getByRole("button", { name: /^Edit switch$/ }).click()
  443 |   const selects = page.getByRole("combobox")
  444 |   await selects.nth(0).click()
  445 |   await page.getByRole("option", { name: input.companyName }).click()
  446 |   await selects.nth(1).click()
  447 |   await page.getByRole("option", { name: input.accountingYear }).click()
  448 |   await page.getByRole("button", { name: /^Update$/ }).click()
  449 |   await expect(page.getByText(input.companyName).first()).toBeVisible()
  450 |   await expect(page.getByText(input.accountingYear).first()).toBeVisible()
  451 | }
  452 | 
  453 | function activePanelInputs(page: Page) {
  454 |   return page.locator('[role="tabpanel"][data-state="active"] input:not([type="checkbox"])')
  455 | }
  456 | 
  457 | function valueForInput({
  458 |   index,
  459 |   input,
  460 | }: {
  461 |   index: number
  462 |   input: { code: string; name: string }
  463 | }) {
  464 |   const path = input.path
  465 |   if (path.includes("/contacts")) {
  466 |     return [input.name, input.code, input.name, "Customer", "0", "0"][index] ?? "1"
  467 |   }
  468 |   if (path.includes("/products")) {
  469 |     return [input.name, input.code, "Product Type", "HSN", "Unit", "18"][index] ?? "1"
  470 |   }
  471 |   if (path.includes("accounting-year")) {
  472 |     return [input.name, "2026-04-01", "2027-03-31", "2026-04-01", "true"][index] ?? "1"
  473 |   }
  474 |   if (path.includes("countries")) {
  475 |     return [input.name, input.code, "+91"][index] ?? "1"
  476 |   }
  477 |   if (path.includes("states")) {
  478 |     return [input.name, input.code, "India"][index] ?? "1"
  479 |   }
  480 |   if (path.includes("districts")) {
  481 |     return [input.name, relatedName(input.name, "States")][index] ?? "1"
  482 |   }
  483 |   if (path.includes("cities")) {
  484 |     return [input.name, relatedName(input.name, "Districts")][index] ?? "1"
  485 |   }
  486 |   if (path.includes("hsn-codes")) {
  487 |     return [input.name, input.code][index] ?? "1"
  488 |   }
  489 |   if (path.includes("taxes")) {
  490 |     return [input.name, "18"][index] ?? "1"
  491 |   }
  492 |   if (path.includes("priorities")) {
  493 |     return [input.name, "#ef4444", "HIGH"][index] ?? "1"
  494 |   }
  495 |   if (path.includes("transports")) {
  496 |     return [input.name, "33ABCDE1234F1Z5", "TN01AB1234", "+91-9876543210", "Manager"][index] ?? "1"
  497 |   }
  498 |   if (index === 0) return input.name
  499 |   if (index === 1) return input.code
  500 |   return "1"
  501 | }
  502 | 
  503 | function relatedName(currentName: string, moduleName: string) {
  504 |   const suffix = currentName.match(/(\d+)$/)?.[1] ?? ""
  505 |   return `E2E ${moduleName}${suffix ? ` ${suffix}` : ""}`
  506 | }
  507 | 
  508 | async function expectApiContains(page: Page, path: string, field: string, value: string) {
  509 |   const auth = await tenantAuth(page)
  510 |   const response = await page.request.get(`${apiBaseUrl}${path}`, {
  511 |     headers: auth,
  512 |   })
  513 |   expect(response.status()).toBe(200)
  514 |   const body = await response.json()
  515 |   expect(Array.isArray(body.data)).toBe(true)
  516 |   expect(body.data.some((record: Record<string, unknown>) => record[field] === value)).toBe(true)
  517 | }
  518 | 
  519 | async function expectApiNotContains(page: Page, path: string, field: string, value: string) {
  520 |   const auth = await tenantAuth(page)
  521 |   const response = await page.request.get(`${apiBaseUrl}${path}`, {
  522 |     headers: auth,
  523 |   })
```