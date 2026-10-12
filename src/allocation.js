import { integer, objectOptions } from "./options.js";

export class AllocationExhaustedError extends Error {
  constructor(attempts) {
    super(`Could not claim a code within ${attempts} attempts.`);
    this.name = "AllocationExhaustedError";
    this.attempts = attempts;
  }
}

function checkAbort(signal) {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Allocation aborted.", "AbortError");
  }
}

export async function claimUnique(options) {
  objectOptions(options, ["generate", "claim", "isReserved", "maxAttempts", "signal"]);
  const { generate, claim, isReserved, signal } = options;
  if (typeof generate !== "function" || typeof claim !== "function") {
    throw new TypeError("generate and claim must be functions.");
  }
  if (isReserved !== undefined && typeof isReserved !== "function") {
    throw new TypeError("isReserved must be a function.");
  }
  const maxAttempts = integer(options.maxAttempts ?? 5, "maxAttempts", 1, 1_000);
  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    checkAbort(signal);
    const code = generate();
    if (typeof code !== "string" || !/^[A-Za-z0-9_-]{4,15}$/.test(code)) {
      throw new TypeError("generate must return a 4–15 character URL-safe ASCII code.");
    }
    if (isReserved) {
      const reserved = await isReserved(code);
      if (typeof reserved !== "boolean") throw new TypeError("isReserved must return a boolean.");
      if (reserved) continue;
    }
    checkAbort(signal);
    const result = await claim(code);
    if (result?.status === "claimed") {
      // A committed claim is returned even if cancellation arrived in flight.
      return Object.freeze({ code, value: result.value, attempts });
    }
    if (result?.status !== "conflict") {
      throw new TypeError('claim must return { status: "claimed", value } or { status: "conflict" }.');
    }
  }
  checkAbort(signal);
  throw new AllocationExhaustedError(maxAttempts);
}
