/*! nanohash | MIT | Bundles Nano ID where applicable; see THIRD_PARTY_NOTICES.md */

// src/options.js
var ALPHABETS = Object.freeze({
  base36: "0123456789abcdefghijklmnopqrstuvwxyz",
  base62: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  url64: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-",
  human32: "0123456789abcdefghjkmnpqrstvwxyz"
});
var PRESETS = Object.freeze({
  link: Object.freeze({ alphabet: "base36", length: 8 }),
  tiny: Object.freeze({ alphabet: "base36", length: 5 }),
  dense: Object.freeze({ alphabet: "url64", length: 8 }),
  long: Object.freeze({ alphabet: "base36", length: 12 }),
  human: Object.freeze({ alphabet: "human32", length: 8 })
});
function objectOptions(value, allowed) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Options must be an object.");
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown option: ${key}`);
  }
  return value;
}
function integer(value, name, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max}.`);
  }
  return value;
}

// src/allocation.js
var AllocationExhaustedError = class extends Error {
  constructor(attempts) {
    super(`Could not claim a code within ${attempts} attempts.`);
    this.name = "AllocationExhaustedError";
    this.attempts = attempts;
  }
};
function checkAbort(signal) {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Allocation aborted.", "AbortError");
  }
}
async function claimUnique(options) {
  objectOptions(options, ["generate", "claim", "isReserved", "maxAttempts", "signal"]);
  const { generate, claim, isReserved, signal } = options;
  if (typeof generate !== "function" || typeof claim !== "function") {
    throw new TypeError("generate and claim must be functions.");
  }
  if (isReserved !== void 0 && typeof isReserved !== "function") {
    throw new TypeError("isReserved must be a function.");
  }
  const maxAttempts = integer(options.maxAttempts ?? 5, "maxAttempts", 1, 1e3);
  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    checkAbort(signal);
    const code = generate();
    if (typeof code !== "string" || !/^[A-Za-z0-9_-]{4,15}$/.test(code)) {
      throw new TypeError("generate must return a 4\u201315 character URL-safe ASCII code.");
    }
    if (isReserved) {
      const reserved = await isReserved(code);
      if (typeof reserved !== "boolean") throw new TypeError("isReserved must return a boolean.");
      if (reserved) continue;
    }
    checkAbort(signal);
    const result = await claim(code);
    if (result?.status === "claimed") {
      return Object.freeze({ code, value: result.value, attempts });
    }
    if (result?.status !== "conflict") {
      throw new TypeError('claim must return { status: "claimed", value } or { status: "conflict" }.');
    }
  }
  checkAbort(signal);
  throw new AllocationExhaustedError(maxAttempts);
}
export {
  AllocationExhaustedError,
  claimUnique
};
//# sourceMappingURL=allocation.js.map
