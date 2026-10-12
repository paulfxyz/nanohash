import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import { ALPHABETS, PRESETS, createGenerator, nanohash, validateCode } from "../dist/index.js";

test("default and shorthand generate valid lowercase codes", () => {
  assert.match(nanohash(), /^[a-z0-9]{8}$/);
  assert.match(nanohash(12), /^[a-z0-9]{12}$/);
  assert.equal(createGenerator().config.entropyBits, 8 * Math.log2(36));
});

for (const [alphabet, characters] of Object.entries(ALPHABETS)) {
  for (let length = 4; length <= 15; length++) {
    test(`${alphabet}: length ${length}`, () => {
      const generate = createGenerator({ alphabet, length, allowTiny: true });
      for (const value of generate.batch(32)) {
        assert.equal(value.length, length);
        assert.ok([...value].every(char => characters.includes(char)));
        assert.ok(validateCode(value, { alphabet, length }));
      }
    });
  }
}

test("alphabet names match actual symbol counts", () => {
  assert.equal(ALPHABETS.base36.length, 36);
  assert.equal(ALPHABETS.base62.length, 62);
  assert.equal(ALPHABETS.url64.length, 64);
  assert.equal(ALPHABETS.human32.length, 32);
  for (const alphabet of Object.values(ALPHABETS)) assert.equal(new Set(alphabet).size, alphabet.length);
});

test("tiny codes require a deliberate opt-in", () => {
  assert.throws(() => createGenerator({ length: 4 }), /allowTiny/);
  assert.throws(() => createGenerator({ preset: "tiny" }), /allowTiny/);
  assert.equal(createGenerator({ preset: "tiny", allowTiny: true })().length, 5);
});

test("all presets work and configuration is immutable", () => {
  for (const [preset, config] of Object.entries(PRESETS)) {
    const generate = createGenerator({ preset, allowTiny: true });
    assert.equal(generate().length, config.length);
    assert.ok(Object.isFrozen(generate));
    assert.ok(Object.isFrozen(generate.config));
  }
  assert.throws(() => { PRESETS.link.length = 4; }, TypeError);
});

test("custom alphabets and format-only validation", () => {
  assert.match(createGenerator({ characters: "abcd", length: 6 })(), /^[abcd]{6}$/);
  assert.equal(validateCode("aaaa", { characters: "ab", length: 4 }), true);
  assert.equal(validateCode("aaac", { characters: "ab", length: 4 }), false);
  assert.equal(validateCode(null), false);
  assert.equal(validateCode("ABCDefgh"), false);
  assert.equal(validateCode("abcd"), false);
});

test("invalid inputs are rejected rather than coerced or silently ignored", () => {
  for (const length of [0, 3, 16, 8.5, "8", NaN, Infinity]) {
    assert.throws(() => createGenerator({ length, allowTiny: true }), /length/);
  }
  for (const characters of ["", "a", "aabc", "ab cd", "ab/c", "éabc", "ab#c", 42]) {
    assert.throws(() => createGenerator({ characters }), /characters/);
  }
  for (const options of [null, [], "base36", { lenght: 8 }, { alphabet: "base37" }, { preset: "__proto__" }, { allowTiny: "yes" }]) {
    assert.throws(() => createGenerator(options));
  }
  assert.throws(() => createGenerator({ alphabet: "base36", characters: "abc" }), /not both/);
  assert.throws(() => createGenerator({ preset: "link", alphabet: "base62" }), /not both/);
  assert.throws(() => createGenerator().batch(0), /batch size/);
  assert.throws(() => createGenerator().batch(10_001), /batch size/);
});

test("CJS entry point is really require-compatible", () => {
  const require = createRequire(import.meta.url);
  const cjs = require("../dist/index.cjs");
  assert.match(cjs.nanohash(), /^[a-z0-9]{8}$/);
  assert.equal(cjs.analyzeSpace().space, "2821109907456");
});

test("bundled generator fails closed when Web Crypto is missing", async () => {
  const source = await readFile(new URL("../dist/index.cjs", import.meta.url), "utf8");
  const sandbox = { module: { exports: {} }, exports: {}, crypto: undefined };
  vm.runInNewContext(source, sandbox);
  assert.throws(() => sandbox.module.exports.nanohash(), /Secure Web Crypto/);
});

test("batch returns candidates, not a storage or uniqueness claim", () => {
  const next = createGenerator({ characters: "ab", length: 4, allowTiny: true });
  const batch = next.batch(17);
  assert.equal(batch.length, 17);
  assert.ok(new Set(batch).size < batch.length);
});
