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
export {
  analyzeSpace,
  recommendLength
};
//# sourceMappingURL=analysis.js.map
