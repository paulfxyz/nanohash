import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run = (...args) => spawnSync(process.execPath, ["dist/cli.js", ...args], { encoding: "utf8" });

test("CLI generates real codes and JSON batches", () => {
  const one = run();
  assert.equal(one.status, 0);
  assert.match(one.stdout.trim(), /^[a-z0-9]{8}$/);
  const many = run("--length", "12", "--count", "3", "--json");
  assert.equal(JSON.parse(many.stdout).length, 3);
  assert.ok(JSON.parse(many.stdout).every(value => /^[a-z0-9]{12}$/.test(value)));
});

test("CLI enforces tiny opt-in and parses counts strictly", () => {
  assert.equal(run("--length", "4").status, 1);
  assert.equal(run("--length", "4", "--tiny").status, 0);
  assert.equal(run("analyze", "--generated", "1e5").status, 1);
  assert.equal(run("--count", "0").status, 1);
});

test("CLI analysis, recommendation, help, and version", () => {
  assert.equal(JSON.parse(run("analyze", "--length", "15", "--alphabet", "url64", "--json").stdout).entropyBits, 90);
  assert.equal(JSON.parse(run("recommend", "--generated", "100000", "--json").stdout).length, 11);
  assert.equal(run("recommend", "--generated", "100000", "--max", "4").status, 2);
  assert.match(run("--help").stdout, /not cryptographic hashes/);
  assert.equal(run("--version").stdout.trim(), "0.1.0");
});

test("CLI rejects unknown commands and flags without a stack trace", () => {
  const result = run("unknown");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^nanohash: Unknown command/);
  assert.doesNotMatch(result.stderr, /at file:/);
  assert.equal(run("--unknown").status, 1);
  assert.equal(run("generate", "extra").status, 1);
});
