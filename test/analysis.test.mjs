import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSpace, recommendLength } from "../dist/analysis.js";

test("space remains exact beyond the safe-integer boundary", () => {
  const analysis = analyzeSpace({ alphabet: "url64", length: 15 });
  assert.equal(analysis.space, "1237940039285380274899124224");
  assert.equal(analysis.entropyBits, 90);
  assert.doesNotThrow(() => JSON.stringify(analysis));
});

test("birthday examples are reproducible", () => {
  const six = analyzeSpace({ length: 6, generatedCount: 100_000 });
  const eight = analyzeSpace({ length: 8, generatedCount: 100_000 });
  assert.ok(Math.abs(six.collisionProbability - 0.8994344293854375) < 1e-12);
  assert.ok(Math.abs(eight.collisionProbability - 0.0017707646950161744) < 1e-12);
});

test("collision and guessing are distinct, with stable tiny probabilities", () => {
  const a = analyzeSpace({ alphabet: "url64", length: 15, generatedCount: 2n, activeCodes: 1n, guesses: 1n });
  assert.ok(a.collisionProbability > 0);
  assert.ok(a.anyHitProbability > 0);
  assert.equal(a.generatedCount, "2");
  assert.equal(analyzeSpace({ generatedCount: 1 }).collisionProbability, 0);
  assert.equal(analyzeSpace({ activeCodes: 0, guesses: 100 }).anyHitProbability, 0);
  assert.equal(analyzeSpace({ activeCodes: 100, guesses: 0 }).anyHitProbability, 0);
});

test("finite spaces and impossible occupancy", () => {
  const full = analyzeSpace({ characters: "ab", length: 4, generatedCount: 17, activeCodes: 16, guesses: 1 });
  assert.equal(full.collisionProbability, 1);
  assert.equal(full.anyHitProbability, 1);
  assert.throws(() => analyzeSpace({ characters: "ab", length: 4, activeCodes: 17 }), /cannot exceed/);
});

test("large bigint counts do not produce NaN", () => {
  const a = analyzeSpace({ generatedCount: 10n ** 400n, activeCodes: 1, guesses: 10n ** 400n });
  assert.equal(a.collisionProbability, 1);
  assert.equal(a.anyHitProbability, 1);
});

test("analysis rejects invalid counts and misspelled options", () => {
  for (const generatedCount of [-1, 0.5, "100", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => analyzeSpace({ generatedCount }), /generatedCount/);
  }
  assert.throws(() => analyzeSpace({ issued: 100 }));
  assert.throws(() => analyzeSpace({ length: 16 }));
});

test("recommendation returns the shortest qualifying length", () => {
  const r = recommendLength({ generatedCount: 100_000, maxCollisionProbability: 1e-6 });
  assert.equal(r.feasible, true);
  assert.equal(r.length, 11);
  assert.ok(r.analysis.collisionProbability <= 1e-6);
  assert.ok(analyzeSpace({ length: 10, generatedCount: 100_000 }).collisionProbability > 1e-6);
});

test("recommendation never silently exceeds supplied bounds", () => {
  const r = recommendLength({ generatedCount: 100_000, maxLength: 8, maxCollisionProbability: 1e-6 });
  assert.equal(r.feasible, false);
  assert.equal(r.length, null);
  assert.equal(r.analysis.length, 8);
  assert.match(r.reason, /No length/);
});

test("recommendation validates budgets and bounds", () => {
  for (const risk of [0, 1, -1, NaN, "0.1", Infinity]) {
    assert.throws(() => recommendLength({ maxCollisionProbability: risk }), /maxCollisionProbability/);
  }
  assert.throws(() => recommendLength({ minLength: 12, maxLength: 8 }));
  assert.throws(() => recommendLength({ expected: 1000 }));
  assert.equal(recommendLength({ generatedCount: 0 }).length, 4);
});
