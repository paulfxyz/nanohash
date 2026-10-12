import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.PLAYGROUND_URL ?? "http://127.0.0.1:4173";
await mkdir("assets/screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "chromium" });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1120 }, colorScheme: "light", deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "assets/screenshots/playground-light.png" });
  await page.getByTestId("button-theme").click();
  await page.screenshot({ path: "assets/screenshots/playground-dark.png" });
  await page.getByTestId("button-theme").click();
  await page.locator("#sizing").screenshot({ path: "assets/screenshots/sizing.png" });
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto(`${base}/brand-card.html`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "assets/readme-banner.png" });
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, colorScheme: "light", deviceScaleFactor: 1 });
  const phone = await mobile.newPage();
  await phone.goto(base, { waitUntil: "networkidle" });
  await phone.locator(".workbench").screenshot({ path: "assets/screenshots/playground-mobile.png" });
  await mobile.close();
  await context.close();
  console.log("Captured brand banner and real light, dark, sizing, and mobile screenshots.");
} finally {
  await browser.close();
}
