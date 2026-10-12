import { count, integer, objectOptions, resolveAlphabet } from "./options.js";

function collisionProbability(generated, space) {
  if (generated < 2n) return 0;
  if (generated > space) return 1;
  return -Math.expm1(
    -Number(generated) * Number(generated - 1n) / (2 * Number(space))
  );
}

export function analyzeSpace(options = {}) {
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
    anyHitProbability = activeCodes === space
      ? 1
      : -Math.expm1(Number(guesses) * Math.log1p(-Number(activeCodes) / Number(space)));
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

export function recommendLength(options = {}) {
  objectOptions(options, ["alphabet", "characters", "generatedCount", "maxCollisionProbability", "minLength", "maxLength"]);
  resolveAlphabet(options);
  const minLength = integer(options.minLength ?? 4, "minLength", 4, 15);
  const maxLength = integer(options.maxLength ?? 15, "maxLength", minLength, 15);
  const budget = options.maxCollisionProbability ?? 0.000001;
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
