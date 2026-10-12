import { customAlphabet } from "nanoid";
import { integer, resolveGenerator } from "./options.js";

export { ALPHABETS, PRESETS } from "./options.js";
export { analyzeSpace, recommendLength } from "./analysis.js";
export { claimUnique, AllocationExhaustedError } from "./allocation.js";

export function createGenerator(options = {}) {
  const config = resolveGenerator(options);
  const next = customAlphabet(config.characters, config.length);
  const generate = () => {
    if (typeof globalThis.crypto?.getRandomValues !== "function") {
      throw new Error("Secure Web Crypto is required. nanohash never falls back to Math.random().");
    }
    return next();
  };
  Object.defineProperties(generate, {
    config: { value: config, enumerable: true },
    batch: {
      value: (size = 10) => Array.from(
        { length: integer(size, "batch size", 1, 10_000) },
        () => generate()
      ),
      enumerable: true
    }
  });
  return Object.freeze(generate);
}

const defaultGenerator = createGenerator();

export function nanohash(length = 8) {
  return length === 8 ? defaultGenerator() : createGenerator({ length })();
}

export function validateCode(value, options = {}) {
  const config = resolveGenerator(options, false);
  return typeof value === "string" &&
    value.length === config.length &&
    [...value].every(character => config.characters.includes(character));
}
