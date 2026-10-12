import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("text-code")).toHaveText(/^[a-z0-9]{8}$/);
});

test("generation, batch controls, presets, and light/dark round trip", async ({ page }) => {
  const first = await page.getByTestId("text-code").textContent();
  await page.getByTestId("button-generate").click();
  await expect(page.getByTestId("text-code")).not.toHaveText(first);
  await page.getByTestId("select-batch").selectOption("10");
  await expect(page.locator(".batch-code")).toHaveCount(10);
  await page.getByTestId("select-preset").selectOption("long");
  await expect(page.getByTestId("text-code")).toHaveText(/^[a-z0-9]{12}$/);
  await page.getByTestId("select-preset").selectOption("human");
  await expect(page.getByTestId("text-code")).toHaveText(/^[0-9abcdefghjkmnpqrstvwxyz]{8}$/);
  const theme = await page.locator("html").getAttribute("data-theme");
  await page.getByTestId("button-theme").click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", theme);
  await page.getByTestId("button-theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
});

test("tiny mode is explicit and resets with settings", async ({ page }) => {
  await page.getByTestId("select-preset").selectOption("tiny");
  await expect(page.getByTestId("button-generate")).toBeDisabled();
  await expect(page.getByTestId("button-copy-code")).toBeDisabled();
  await page.getByTestId("input-allow-tiny").check();
  await expect(page.getByTestId("text-code")).toHaveText(/^[a-z0-9]{5}$/);
  await page.getByTestId("input-allow-tiny").uncheck();
  await expect(page.getByTestId("button-generate")).toBeDisabled();
});

test("custom alphabets fail visibly and recover", async ({ page }) => {
  await page.getByTestId("select-alphabet").selectOption("custom");
  await page.getByTestId("input-characters").fill("aabc");
  await expect(page.getByTestId("status-message")).toContainText("duplicate");
  await expect(page.getByTestId("button-copy-code")).toBeDisabled();
  await page.getByTestId("input-characters").fill("abcd");
  await expect(page.getByTestId("text-code")).toHaveText(/^[abcd]{8}$/);
});

test("sizing recommends a real length and keeps invalid inputs safe", async ({ page }) => {
  await page.getByTestId("button-recommend").click();
  await expect(page.locator("#recommendation-text")).toContainText("11 characters");
  await page.getByTestId("button-use-recommendation").click();
  await expect(page.getByTestId("text-code")).toHaveText(/^[a-z0-9]{11}$/);
  await page.getByTestId("input-generated-count").fill("1000000000000");
  await page.getByTestId("select-risk-budget").selectOption("0.000000000001");
  await expect(page.locator("#recommendation-text")).toContainText("No length");
  await expect(page.getByTestId("button-use-recommendation")).toBeHidden();
  await page.getByTestId("input-generated-count").fill("");
  await expect(page.getByTestId("status-message")).toContainText("non-negative");
  await page.getByTestId("input-generated-count").fill("100000");
  await page.getByTestId("select-risk-budget").selectOption("0.000001");
  await page.getByTestId("button-generate").click();
  await expect(page.getByTestId("text-code")).toHaveText(/^[a-z0-9]{11}$/);
});

test("copy actions acknowledge success or provide an honest fallback", async ({ page }) => {
  await page.getByTestId("button-copy-code").click();
  await expect(page.getByTestId("status-message")).toContainText(/copied|unavailable/);
  await page.getByTestId("button-copy-batch").click();
  await expect(page.getByTestId("status-message")).toContainText(/copied|unavailable/);
  await page.getByTestId("button-copy-install").click();
  await expect(page.getByTestId("button-copy-install")).toHaveText(/Copied|Select command/);
});

test("page fits its viewport and reports no application exceptions", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.getByTestId("select-alphabet").selectOption("url64");
  await page.getByTestId("input-length").focus();
  await page.keyboard.press("End");
  await expect(page.getByTestId("text-code")).toHaveText(/^[A-Za-z0-9_-]{15}$/);
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: window.innerWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.width);
  expect(errors).toEqual([]);
  await expect(page.getByTestId("chart-lengths").locator(".chart-row")).toHaveCount(12);
});
