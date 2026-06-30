import { expect, test } from "@playwright/test"

test("super admin side menu stays visible", async ({ page }) => {
  await page.goto("/sa/login")
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1")
  await page.getByRole("button", { name: /Sign in/i }).click()

  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Overview" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Admin" })).toBeVisible()

  await page.goto("/sa/plans")
  await expect(page.getByRole("heading", { name: "Plans" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Plan", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Subscription", exact: true })).toBeVisible()
})
