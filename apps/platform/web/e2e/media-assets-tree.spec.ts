import { expect, test, type Page } from "@playwright/test"

const apiBaseUrl = "http://127.0.0.1:5510"

test("media assets render storage tree and select file leaves without hanging", async ({ page }) => {
  test.setTimeout(90_000)
  const browserErrors: string[] = []
  collectBrowserErrors(page, browserErrors)

  await loginAsTenant(page)
  const asset = await createMediaAsset(page)

  await page.goto("/tenant/media/media-assets")
  await expect(page.getByRole("heading", { name: "Media Assets" })).toBeVisible()
  await expect(page.getByRole("tree")).toBeVisible()
  await expect(page.getByRole("button", { name: /All media/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /Folders/i })).toBeVisible()
  await expect(page.getByRole("button", { name: new RegExp(asset.tenantSlug, "i") })).toBeVisible()
  await expect(page.getByRole("button", { name: /private/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /logo/i })).toBeVisible()

  await page.getByRole("button", { name: /e2e/i }).click()
  await expect(page.getByRole("heading", { name: "e2e", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: new RegExp(escapeRegex(asset.fileName)) })).toBeVisible()

  await page.getByRole("button", { name: new RegExp(escapeRegex(asset.fileName)) }).click()
  await expect(page.locator("h2", { hasText: asset.fileName })).toBeVisible()
  await expect(page.getByText("1 assets shown")).toBeVisible()
  await expect(page.locator("article").filter({ hasText: asset.originalName })).toBeVisible()

  const image = page.locator("article img").first()
  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute("src", /\/media\/assets\/.+\/content\?/)
  await expect(page.locator("article").filter({ hasText: asset.originalName })).toBeVisible()

  expect(browserErrors).toEqual([])
})

async function createMediaAsset(page: Page) {
  const suffix = Date.now()
  const auth = await tenantHeaders(page)
  const fileName = `e2e-tree-${suffix}.svg`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><rect width="96" height="64" fill="#2563eb"/><circle cx="48" cy="32" r="18" fill="#fff"/></svg>`
  const response = await page.request.post(`${apiBaseUrl}/media/assets`, {
    data: {
      altText: `E2E tree ${suffix}`,
      caption: `Tree visual ${suffix}`,
      category: "files",
      dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      fileName,
      folder: "logo/e2e",
      mimeType: "image/svg+xml",
      originalName: fileName,
      visibility: "private",
    },
    headers: auth,
  })
  expect(response.status(), await response.text()).toBe(200)
  const body = await response.json()
  const asset = body.data as { fileName: string; originalName: string; tenantSlug: string }
  expect(asset.fileName).toBeTruthy()
  expect(asset.tenantSlug).toBeTruthy()
  return asset
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

async function tenantHeaders(page: Page) {
  const sessionToken = await page.evaluate(() => localStorage.getItem("codexsun_session_tenant") ?? "")
  const tenantId = await page.evaluate(() => localStorage.getItem("codexsun_tenant_id") ?? "")
  expect(sessionToken).toBeTruthy()
  expect(tenantId).toBeTruthy()
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
