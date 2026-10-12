import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("standalone lite ESM generates every supported length in the browser", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const lite = await import("/lib/lite.js");
    return {
      exports: Object.keys(lite),
      defaultCode: lite.nanohash(),
      codes: Array.from({ length: 12 }, (_, index) => lite.nanohash(index + 4, { allowTiny: true }))
    };
  });
  expect(result.exports).toEqual(["nanohash"]);
  expect(result.defaultCode).toMatch(/^[a-z0-9]{8}$/);
  result.codes.forEach((code, index) => {
    expect(code).toMatch(/^[a-z0-9]+$/);
    expect(code).toHaveLength(index + 4);
  });
});

test("browser lite rejects tiny codes and unsupported options without silent coercion", async ({ page }) => {
  const errors = await page.evaluate(async () => {
    const { nanohash } = await import("/lib/lite.js");
    return [
      () => nanohash(5),
      () => nanohash(8, { alphabet: "url64" }),
      () => nanohash("8")
    ].map(call => {
      try { call(); return "unexpected success"; }
      catch (error) { return error.name; }
    });
  });
  expect(errors).toEqual(["RangeError", "TypeError", "RangeError"]);
});

test("browser lite fails closed without Web Crypto", async ({ page }) => {
  const message = await page.evaluate(async () => {
    const { nanohash } = await import("/lib/lite.js");
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    try {
      Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
      try { nanohash(); return "unexpected success"; }
      catch (error) { return error.message; }
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
      else delete globalThis.crypto;
    }
  });
  expect(message).toContain("Secure Web Crypto");
});
