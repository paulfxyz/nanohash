/*! nanohash | MIT | Bundles Nano ID where applicable; see THIRD_PARTY_NOTICES.md */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.js
var index_exports = {};
__export(index_exports, {
  ALPHABETS: () => ALPHABETS,
  AllocationExhaustedError: () => AllocationExhaustedError,
  PRESETS: () => PRESETS,
  analyzeSpace: () => analyzeSpace,
  claimUnique: () => claimUnique,
  createGenerator: () => createGenerator,
  nanohash: () => nanohash,
  recommendLength: () => recommendLength,
  validateCode: () => validateCode
});
module.exports = __toCommonJS(index_exports);

// node_modules/nanoid/index.browser.js
var random = (bytes) => crypto.getRandomValues(new Uint8Array(bytes));
var customRandom = (alphabet, defaultSize, getRandom) => {
  let safeByteCutoff = 256 - 256 % alphabet.length;
  if (safeByteCutoff === 256) {
    let mask = alphabet.length - 1;
    return (size = defaultSize) => {
      if (!size) return "";
      let id = "";
      while (true) {
        let bytes = getRandom(size);
        let j = size |= 0;
        while (j--) {
          id += alphabet[bytes[j] & mask];
          if (id.length >= size) return id;
        }
      }
    };
  }
  return (size = defaultSize) => {
    if (!size) return "";
    let id = "";
    let step = Math.ceil(1.6 * 256 * size / safeByteCutoff);
    while (true) {
      let bytes = getRandom(step);
      let j = step;
      while (j--) {
        if (bytes[j] < safeByteCutoff) {
          id += alphabet[bytes[j] % alphabet.length];
          if (id.length >= size) return id;
        }
      }
    }
  };
};
var customAlphabet = (alphabet, size = 21) => customRandom(alphabet, size | 0, random);

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
function resolveAlphabet({ alphabet, characters } = {}) {
  if (alphabet !== void 0 && characters !== void 0) {
    throw new TypeError("Choose alphabet or characters, not both.");
  }
  if (characters !== void 0) {
    if (typeof characters !== "string" || !/^[A-Za-z0-9_-]{2,64}$/.test(characters)) {
      throw new TypeError("Custom characters must contain 2\u201364 distinct URL-safe ASCII symbols.");
    }
    if (new Set(characters).size !== characters.length) {
      throw new TypeError("Custom characters must not contain duplicate symbols.");
    }
    return { alphabet: null, characters };
  }
  const name = alphabet ?? "base36";
  if (typeof name !== "string" || !Object.hasOwn(ALPHABETS, name)) {
    throw new TypeError(`Unknown alphabet: ${String(name)}`);
  }
  return { alphabet: name, characters: ALPHABETS[name] };
}
function resolveGenerator(options = {}, enforceTiny = true) {
  objectOptions(options, ["preset", "alphabet", "characters", "length", "allowTiny"]);
  if (options.preset !== void 0 && (typeof options.preset !== "string" || !Object.hasOwn(PRESETS, options.preset))) {
    throw new TypeError(`Unknown preset: ${String(options.preset)}`);
  }
  if (options.preset !== void 0 && (options.alphabet !== void 0 || options.characters !== void 0)) {
    throw new TypeError("Choose preset or alphabet/characters, not both.");
  }
  if (options.allowTiny !== void 0 && typeof options.allowTiny !== "boolean") {
    throw new TypeError("allowTiny must be a boolean.");
  }
  const preset = options.preset === void 0 ? null : PRESETS[options.preset];
  const resolved = resolveAlphabet({
    alphabet: preset?.alphabet ?? options.alphabet,
    characters: options.characters
  });
  const length = integer(options.length ?? preset?.length ?? 8, "length", 4, 15);
  if (enforceTiny && length < 6 && options.allowTiny !== true) {
    throw new RangeError("Lengths 4\u20135 require allowTiny: true. Compact codes are not access secrets.");
  }
  return Object.freeze({
    ...resolved,
    length,
    alphabetSize: resolved.characters.length,
    entropyBits: length * Math.log2(resolved.characters.length),
    tiny: length < 6
  });
}
function count(value, name, fallback = 0n) {
  if (value === void 0) return fallback;
  if (typeof value === "bigint" && value >= 0n) return value;
  if (Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  throw new RangeError(`${name} must be a non-negative safe integer or bigint.`);
}

// src/analysis.js
function collisionProbability(generated, space) {
  if (generated < 2n) return 0;
  if (generated > space) return 1;
  return -Math.expm1(
    -Number(generated) * Number(generated - 1n) / (2 * Number(space))
  );
}
function analyzeSpace(options = {}) {
  objectOptions(options, ["alphabet", "characters", "length", "generatedCount", "activeCodes", "guesses"]);
  const { alphabet, characters } = resolveAlphabet(options);
  const length = integer(options.length ?? 8, "length", 4, 15);
  const generatedCount = count(options.generatedCount, "generatedCount");
  const activeCodes = count(options.activeCodes, "activeCodes");
  const guesses = count(options.guesses, "guesses");
  const space = BigInt(characters.length) ** BigInt(length);
  if (activeCodes > space) throw new RangeError("activeCodes cannot exceed the character space.");
  let anyHitProbability = 0;
  if (activeCodes > 0n && guesses > 0n) {
    anyHitProbability = activeCodes === space ? 1 : -Math.expm1(Number(guesses) * Math.log1p(-Number(activeCodes) / Number(space)));
  }
  return Object.freeze({
    alphabet,
    alphabetSize: characters.length,
    length,
    space: space.toString(),
    entropyBits: length * Math.log2(characters.length),
    generatedCount: generatedCount.toString(),
    activeCodes: activeCodes.toString(),
    guesses: guesses.toString(),
    collisionProbability: collisionProbability(generatedCount, space),
    anyHitProbability,
    assumptions: Object.freeze([
      "Independent, uniformly sampled characters and guesses.",
      "Collision probability is a birthday approximation before uniqueness retries.",
      "Reserved codes, filtering, and non-uniform vanity codes are not modeled.",
      "Guessing any active code is different from guessing one specific target.",
      "Space is exact; probabilities and bits are floating-point estimates."
    ])
  });
}
function recommendLength(options = {}) {
  objectOptions(options, ["alphabet", "characters", "generatedCount", "maxCollisionProbability", "minLength", "maxLength"]);
  resolveAlphabet(options);
  const minLength = integer(options.minLength ?? 4, "minLength", 4, 15);
  const maxLength = integer(options.maxLength ?? 15, "maxLength", minLength, 15);
  const budget = options.maxCollisionProbability ?? 1e-6;
  if (typeof budget !== "number" || !Number.isFinite(budget) || budget <= 0 || budget >= 1) {
    throw new RangeError("maxCollisionProbability must be greater than 0 and less than 1.");
  }
  const generatedCount = count(options.generatedCount, "generatedCount");
  let analysis;
  for (let length = minLength; length <= maxLength; length++) {
    analysis = analyzeSpace({
      alphabet: options.alphabet,
      characters: options.characters,
      generatedCount,
      length
    });
    if (analysis.collisionProbability <= budget) {
      return Object.freeze({ feasible: true, length, maxCollisionProbability: budget, analysis });
    }
  }
  return Object.freeze({
    feasible: false,
    length: null,
    maxCollisionProbability: budget,
    analysis,
    reason: "No length inside the requested bounds meets this collision budget."
  });
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

// src/index.js
function createGenerator(options = {}) {
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
        { length: integer(size, "batch size", 1, 1e4) },
        () => generate()
      ),
      enumerable: true
    }
  });
  return Object.freeze(generate);
}
var defaultGenerator = createGenerator();
function nanohash(length = 8) {
  return length === 8 ? defaultGenerator() : createGenerator({ length })();
}
function validateCode(value, options = {}) {
  const config = resolveGenerator(options, false);
  return typeof value === "string" && value.length === config.length && [...value].every((character) => config.characters.includes(character));
}
//# sourceMappingURL=index.cjs.map
