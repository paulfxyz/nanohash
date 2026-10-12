import { createGenerator, claimUnique } from "../dist/index.js";

// Demonstration only: this Map is process-local, non-durable, and not a
// substitute for a unique constraint in a multi-process production database.
const records = new Map();
const reserved = new Set(["checkout", "settings"]);
const next = createGenerator();

const allocation = await claimUnique({
  generate: next,
  isReserved: code => reserved.has(code),
  claim: code => {
    // No await between checking and setting: atomic in this single JS process.
    if (records.has(code)) return { status: "conflict" };
    const value = { code, destination: "https://example.com/" };
    records.set(code, value);
    return { status: "claimed", value };
  }
});
console.log(allocation);
