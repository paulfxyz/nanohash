import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], channel: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], channel: "chromium", viewport: { width: 375, height: 812 } } }
  ],
  webServer: {
    command: "npm run site:build && npm run site:serve",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI
  }
});
