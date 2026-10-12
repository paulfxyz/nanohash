import test from "node:test";
import assert from "node:assert/strict";
import { claimUnique, AllocationExhaustedError } from "../dist/allocation.js";

test("reserved values and explicit conflicts cause bounded retries", async () => {
  const codes = ["reserved", "occupied", "newcode1"];
  const result = await claimUnique({
    generate: () => codes.shift(),
    isReserved: code => code === "reserved",
    claim: code => code === "occupied" ? { status: "conflict" } : { status: "claimed", value: 42 }
  });
  assert.deepEqual(result, { code: "newcode1", value: 42, attempts: 3 });
});

test("storage exceptions are not swallowed or retried", async () => {
  let attempts = 0;
  const outage = new Error("Database unavailable");
  await assert.rejects(claimUnique({
    generate: () => "newcode1",
    claim: () => { attempts++; throw outage; }
  }), error => error === outage);
  assert.equal(attempts, 1);
});

test("exhaustion is typed and includes the attempt count", async () => {
  await assert.rejects(claimUnique({
    generate: () => "occupied",
    claim: () => ({ status: "conflict" }),
    maxAttempts: 2
  }), error => error instanceof AllocationExhaustedError && error.attempts === 2);
});

test("concurrent callers rely on an atomic claim, not a preflight check", async () => {
  const keys = new Set();
  const claim = code => {
    if (keys.has(code)) return { status: "conflict" };
    keys.add(code);
    return { status: "claimed", value: code };
  };
  const results = await Promise.allSettled(Array.from({ length: 20 }, () =>
    claimUnique({ generate: () => "samecode", claim, maxAttempts: 1 })
  ));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  assert.equal(keys.size, 1);
});

test("pre-aborted allocation does not call storage", async () => {
  const controller = new AbortController();
  controller.abort(new Error("Stop"));
  await assert.rejects(claimUnique({
    signal: controller.signal,
    generate: () => { assert.fail("Generator must not run"); },
    claim: () => { assert.fail("Storage must not run"); }
  }), /Stop/);
});

test("cancellation while checking reserved codes prevents an insert", async () => {
  const controller = new AbortController();
  await assert.rejects(claimUnique({
    signal: controller.signal,
    generate: () => "newcode1",
    isReserved: async () => { controller.abort(); return false; },
    claim: () => { assert.fail("Storage must not run"); }
  }), { name: "AbortError" });
});

test("a successful in-flight commit is not hidden by cancellation", async () => {
  const controller = new AbortController();
  const result = await claimUnique({
    signal: controller.signal,
    generate: () => "newcode1",
    claim: () => { controller.abort(); return { status: "claimed", value: 1 }; }
  });
  assert.equal(result.value, 1);
});

test("invalid callback contracts fail immediately", async () => {
  for (const claim of [() => true, () => false, () => null, () => ({ status: "ok" })]) {
    await assert.rejects(claimUnique({ generate: () => "newcode1", claim }), /claim must return/);
  }
  await assert.rejects(claimUnique({ generate: () => "bad", claim: () => ({ status: "conflict" }) }), /URL-safe/);
  await assert.rejects(claimUnique({ generate: () => "newcode1", claim: () => true, isReserved: () => "yes" }), /boolean/);
  await assert.rejects(claimUnique({ generate: "bad", claim: () => true }), /functions/);
  await assert.rejects(claimUnique({ generate: () => "newcode1", claim: () => true, maxAttempts: 0 }), /maxAttempts/);
});
