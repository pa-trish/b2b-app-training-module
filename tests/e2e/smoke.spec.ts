import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Training Module" })).toBeVisible();
});

test("manager can sign in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("manager@demo.com");
  await page.getByLabel("Password").fill("manager123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Trainer Dashboard" })).toBeVisible();
});

test("trainee can sign in", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("trainee@demo.com");
  await page.getByLabel("Password").fill("trainee123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "My training" })).toBeVisible();
});
