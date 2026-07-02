# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tenant-modules.spec.ts >> tenant registry routes open wired frontend modules
- Location: apps\platform\web\e2e\tenant-modules.spec.ts:86:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Address Book' }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Address Book' }).first()

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
  1   | import { expect, test, type Page } from "@playwright/test"
  2   | 
  3   | const apiBaseUrl = "http://127.0.0.1:5510"
  4   | 
  5   | const commonModules = [
  6   |   "countries",
  7   |   "states",
  8   |   "districts",
  9   |   "cities",
  10  |   "pincodes",
  11  |   "contact-groups",
  12  |   "contact-types",
  13  |   "address-types",
  14  |   "bank-names",
  15  |   "bank-account-types",
  16  |   "product-groups",
  17  |   "product-categories",
  18  |   "product-types",
  19  |   "units",
  20  |   "hsn-codes",
  21  |   "taxes",
  22  |   "brands",
  23  |   "colours",
  24  |   "sizes",
  25  |   "styles",
  26  |   "order-types",
  27  |   "transports",
  28  |   "warehouses",
  29  |   "destinations",
  30  |   "stock-rejection-types",
  31  |   "currencies",
  32  |   "priorities",
  33  |   "payment-terms",
  34  |   "accounting-year",
  35  |   "months",
  36  |   "sales-account-types",
  37  | ]
  38  | 
  39  | const registryRoutes = [
  40  |   ["/tenant/foundation/users", "Users"],
  41  |   ["/tenant/foundation/rbac-roles", "Roles"],
  42  |   ["/tenant/foundation/rbac-policies", "Permissions"],
  43  |   ["/tenant/foundation/rbac-role-policies", "Permissions"],
  44  |   ["/tenant/foundation/accounting-years", "Accounting Year"],
  45  |   ["/tenant/foundation/default-companies", "Default Company"],
  46  |   ["/tenant/foundation/address-book", "Address Book"],
  47  |   ["/tenant/master/contacts", "Contacts"],
  48  |   ["/tenant/master/contacts/contact-emails", "Contact Emails"],
  49  |   ["/tenant/master/contacts/contact-phones", "Contact Phones"],
  50  |   ["/tenant/master/contacts/contact-social-links", "Contact Social Links"],
  51  |   ["/tenant/master/contacts/contact-bank-accounts", "Contact Bank Accounts"],
  52  |   ["/tenant/master/contacts/contact-gst-details", "Contact GST Details"],
  53  |   ["/tenant/master/companies", "Company"],
  54  |   ["/tenant/master/companies/company-logos", "Company Logos"],
  55  |   ["/tenant/master/companies/company-emails", "Company Emails"],
  56  |   ["/tenant/master/companies/company-phones", "Company Phones"],
  57  |   ["/tenant/master/companies/company-social-links", "Company Social Links"],
  58  |   ["/tenant/master/companies/company-bank-accounts", "Company Bank Accounts"],
  59  |   ["/tenant/master/products", "Products"],
  60  |   ["/tenant/master/products/product-groups", "Product Groups"],
  61  |   ["/tenant/master/products/product-categories", "Product Categories"],
  62  |   ["/tenant/master/products/product-types", "Product Types"],
  63  |   ["/tenant/master/products/units", "Units"],
  64  |   ["/tenant/master/products/hsn-codes", "HSN Codes"],
  65  |   ["/tenant/master/products/taxes", "Taxes"],
  66  |   ["/tenant/master/products/brands", "Brands"],
  67  |   ["/tenant/master/products/colours", "Colours"],
  68  |   ["/tenant/master/products/sizes", "Sizes"],
  69  |   ["/tenant/master/products/styles", "Styles"],
  70  |   ["/tenant/master/work-orders", "Work Orders"],
  71  |   ["/tenant/common/locations", "Common Module Index"],
  72  |   ["/tenant/common/locations/countries", "Countries"],
  73  |   ["/tenant/common/locations/states", "States"],
  74  |   ["/tenant/common/locations/districts", "Districts"],
  75  |   ["/tenant/common/locations/cities", "Cities"],
  76  |   ["/tenant/common/locations/pincodes", "Pincodes"],
  77  |   ["/tenant/common/contact-groups", "Contact Groups"],
  78  |   ["/tenant/common/contact-types", "Contact Types"],
  79  |   ["/tenant/common/address-types", "Address Types"],
  80  |   ["/tenant/common/bank-names", "Bank Names"],
  81  |   ["/tenant/common/order-types", "Order Types"],
  82  |   ["/tenant/common/transports", "Transports"],
  83  |   ["/tenant/common/warehouses", "Warehouses"],
  84  | ] as const
  85  | 
  86  | test("tenant registry routes open wired frontend modules", async ({ page }) => {
  87  |   test.setTimeout(120_000)
  88  |   const browserErrors: string[] = []
  89  |   collectBrowserErrors(page, browserErrors)
  90  | 
  91  |   await loginAsTenant(page)
  92  | 
  93  |   for (const [path, heading] of registryRoutes) {
  94  |     await page.goto(path)
> 95  |     await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible()
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  96  |   }
  97  | 
  98  |   await expect(page.getByRole("button", { name: "Foundation" }).first()).toBeVisible()
  99  |   await expect(page.getByRole("button", { name: "Master" }).first()).toBeVisible()
  100 |   await expect(page.getByRole("button", { name: "Common" }).first()).toBeVisible()
  101 |   expect(browserErrors).toEqual([])
  102 | })
  103 | 
  104 | test("tenant master and common modules save through UI and stay tenant-isolated", async ({ page }) => {
  105 |   test.setTimeout(180_000)
  106 |   const browserErrors: string[] = []
  107 |   const suffix = Date.now()
  108 |   collectBrowserErrors(page, browserErrors)
  109 | 
  110 |   await loginAsTenant(page)
  111 | 
  112 |   await createTenantRecord(page, {
  113 |     code: `CON-${suffix}`,
  114 |     name: `E2E Contact ${suffix}`,
  115 |     path: "/app/contacts",
  116 |   })
  117 |   await expectApiContains(page, "/core/contacts", "name", `E2E Contact ${suffix}`)
  118 |   await expectTenantMismatchBlocked(page, "/core/contacts")
  119 | 
  120 |   await createTenantRecord(page, {
  121 |     code: `PRD-${suffix}`,
  122 |     name: `E2E Product ${suffix}`,
  123 |     path: "/app/products",
  124 |   })
  125 |   await expectApiContains(page, "/core/products", "name", `E2E Product ${suffix}`)
  126 |   await expectTenantMismatchBlocked(page, "/core/products")
  127 | 
  128 |   for (const key of commonModules) {
  129 |     const label = key
  130 |       .split("-")
  131 |       .map((part) => part[0]?.toUpperCase() + part.slice(1))
  132 |       .join(" ")
  133 |     const name = `E2E ${label} ${suffix}`
  134 |     await createTenantRecord(page, {
  135 |       code: `${key.slice(0, 8).toUpperCase()}-${suffix}`,
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
```