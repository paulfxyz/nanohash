import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import * as lite from "@paulfxyz/nanohash/lite";

const require = createRequire(import.meta.url);
const cjsSource = await readFile(new URL("../dist/lite.cjs", import.meta.url), "utf8");
const esmSource = await readFile(new URL("../dist/lite.js", import.meta.url), "utf8");

function isolate(crypto) {
  const math = Object.create(Math);
  math.random = () => assert.fail("Math.random must never be used.");
  const sandbox = { module: { exports: {} }, exports: {}, crypto, Math: math };
  vm.runInNewContext(cjsSource, sandbox);
  return sandbox.module.exports.nanohash;
}

test("lite exposes only its documented function", () => {
  assert.deepEqual(Object.keys(lite), ["nanohash"]);
  assert.match(lite.nanohash(), /^[a-z0-9]{8}$/);
  assert.match(lite.nanohash(undefined, {}), /^[a-z0-9]{8}$/);
});

for (let length = 4; length <= 15; length++) {
  test(`lite supports Base36 length ${length}`, () => {
    for (let i = 0; i < 32; i++) {
      const code = lite.nanohash(length, { allowTiny: true });
      assert.equal(code.length, length);
      assert.match(code, /^[0-9a-z]+$/);
    }
  });
}

test("lite tiny codes require an explicit true acknowledgement", () => {
  for (const length of [4, 5]) {
    for (const options of [undefined, {}, { allowTiny: false }, { allowTiny: undefined }]) {
      assert.throws(() => lite.nanohash(length, options), { name: "RangeError" });
    }
    assert.equal(lite.nanohash(length, { allowTiny: true }).length, length);
  }
});

test("lite rejects invalid lengths without coercion or truncation", () => {
  for (const length of [-1, 0, 3, 16, 6.5, "8", null, NaN, Infinity, 8n, Symbol("8")]) {
    assert.throws(() => lite.nanohash(length, { allowTiny: true }), { name: "RangeError" });
  }
});

test("lite rejects unsupported configuration instead of silently ignoring it", () => {
  for (const options of [
    null, [], true, false, 0, 1, "yes", () => {},
    { alphabet: "url64" }, { preset: "tiny" }, { length: 12 }, { allowTny: true },
    { allowTiny: "true" }, { allowTiny: 1 }, { allowTiny: null }
  ]) {
    assert.throws(() => lite.nanohash(8, options), { name: "TypeError" });
  }
  assert.equal(lite.nanohash(8, { allowTiny: false }).length, 8);
});

test("lite validates bad inputs before asking for random bytes", () => {
  let calls = 0;
  const next = isolate({ getRandomValues() { calls++; throw new Error("Unexpected RNG call"); } });
  assert.throws(() => next(16));
  assert.throws(() => next(5));
  assert.throws(() => next(8, { alphabet: "base62" }));
  assert.equal(calls, 0);
});

test("lite fails closed when Web Crypto is unavailable or malformed", () => {
  for (const crypto of [undefined, null, {}, { getRandomValues: "invalid" }]) {
    assert.throws(() => isolate(crypto)(), /Secure Web Crypto/);
  }
});

test("lite propagates RNG failures without an insecure fallback", () => {
  const failure = new Error("Entropy source unavailable");
  const next = isolate({ getRandomValues() { throw failure; } });
  assert.throws(() => next(), error => error === failure);
});

test("bundled Nano ID rejects out-of-range bytes rather than using biased modulo", () => {
  let calls = 0;
  const next = isolate({
    getRandomValues(bytes) {
      calls++;
      bytes.fill(255); // All 252..255 values must be rejected for Base36.
      bytes[bytes.length - 1] = 251; // 251 % 36 = 35 -> z.
      bytes[bytes.length - 2] = 0;
      return bytes;
    }
  });
  assert.equal(next(6), "z0z0z0");
  assert.equal(calls, 3);
});

test("lite distribution is self-contained and excludes full-toolkit APIs", () => {
  assert.doesNotMatch(esmSource, /\bimport\s/);
  assert.doesNotMatch(esmSource, /\banalyzeSpace\b|\bclaimUnique\b|\bPRESETS\b|\brecommendLength\b|\bcreateGenerator\b/);
  const commonjs = require("@paulfxyz/nanohash/lite");
  assert.deepEqual(Object.keys(commonjs), ["nanohash"]);
  assert.match(commonjs.nanohash(15), /^[a-z0-9]{15}$/);
  assert.match(commonjs.nanohash(4, { allowTiny: true }), /^[a-z0-9]{4}$/);
});
