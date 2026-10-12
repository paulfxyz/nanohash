#!/usr/bin/env node
/*! nanohash | MIT | See THIRD_PARTY_NOTICES.md */

// src/cli.js
import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";

// node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "57X6y3wQZNzYjJB2L_10pxbackgroundhimselfUTF-8DEMOGRAPHICSVqvt4KW9";

// node_modules/nanoid/index.js
var GET_RANDOM_LIMIT = 65536;
function fillRandom(buffer) {
  let from = 0;
  while (from < buffer.length) {
    let to = Math.min(from + GET_RANDOM_LIMIT, buffer.length);
    crypto.getRandomValues(buffer.subarray(from, to));
    from = to;
  }
}
function random(bytes) {
  bytes |= 0;
  if (bytes < 0) throw new RangeError("Wrong ID size");
  let buffer = Buffer.allocUnsafe(bytes);
  fillRandom(buffer);
  return buffer;
}
function customRandom(alphabet, defaultSize, getRandom) {
  let safeByteCutoff = 256 - 256 % alphabet.length;
  if (safeByteCutoff === 256) {
    let mask = alphabet.length - 1;
    return (size = defaultSize) => {
      if (!size) return "";
      let id = "";
      while (true) {
        let bytes = getRandom(size);
        let i = size |= 0;
        while (i--) {
          id += alphabet[bytes[i] & mask];
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
      let i = step;
      while (i--) {
        if (bytes[i] < safeByteCutoff) {
          id += alphabet[bytes[i] % alphabet.length];
          if (id.length >= size) return id;
        }
      }
    }
  };
}
var POOL_MAX = GET_RANDOM_LIMIT / 2;
function customAlphabet(alphabet, defaultSize = 21) {
  if (typeof alphabet !== "string" || !alphabet || alphabet.length > 256) {
    return customRandom(alphabet, defaultSize, random);
  }
  for (let i = 0; i < alphabet.length; i++) {
    if (alphabet.charCodeAt(i) > 255) {
      return customRandom(alphabet, defaultSize, random);
    }
  }
  let charCodes = Uint8Array.from(alphabet, (str) => {
    return str.charCodeAt(0);
  });
  let alphabetLen = alphabet.length;
  let mask = (2 << 31 - Math.clz32(alphabetLen - 1 | 1)) - 1;
  let pool = "";
  let poolOffset = 0;
  let poolNext = 0;
  return (size = defaultSize) => {
    size |= 0;
    if (size < 0) throw new RangeError("Wrong ID size");
    if (size === 0) return "";
    if (poolOffset + size > pool.length) {
      let target = Math.max(poolNext, size);
      poolNext = Math.min(target * 16, POOL_MAX);
      let buffer = Buffer.allocUnsafe(target);
      if (mask === alphabetLen - 1) {
        fillRandom(buffer);
        for (let i = 0; i < target; i++) {
          buffer[i] = charCodes[buffer[i] & mask];
        }
      } else {
        let randomBytes = Buffer.allocUnsafe(
          Math.ceil(1.6 * (mask + 1) * target / alphabetLen)
        );
        let accepted = 0;
        while (accepted < target) {
          fillRandom(randomBytes);
          for (let i = 0; i < randomBytes.length; i++) {
            let index = randomBytes[i] & mask;
            if (index < alphabetLen) {
              buffer[accepted++] = charCodes[index];
              if (accepted === target) break;
            }
          }
        }
      }
      pool = buffer.toString("latin1");
      poolOffset = 0;
    }
    poolOffset += size;
    return pool.substring(poolOffset - size, poolOffset);
  };
}
var nanoid = customAlphabet(urlAlphabet);

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

// src/cli.js
var help = `nanohash: compact random IDs, sized honestly

Usage:
  nanohash [generate] [--length 8] [--alphabet base36] [--count 5]
  nanohash analyze --length 8 --generated 100000
  nanohash recommend --generated 100000 --risk 0.000001

Options:
  --alphabet     base36, base62, url64, or human32
  --characters   Custom distinct URL-safe ASCII alphabet (instead of --alphabet)
  --length       Integer from 4 to 15
  --tiny         Explicit opt-in for generating 4\u20135 character public codes
  --count        Generate 1\u201310000 candidates (default 1)
  --generated    Candidate count for collision analysis
  --active       Active-code count for guessing analysis
  --guesses      Independent guesses to model
  --risk         Collision probability budget, between 0 and 1
  --min / --max  Recommendation length bounds (default 4 / 15)
  --json         Machine-readable output
  --help         Show this help
  --version      Show the package version

Random IDs, not cryptographic hashes. A code is not authorization.
`;
var whole = (value, name) => {
  if (!/^\d+$/.test(value)) throw new TypeError(`${name} must be a non-negative integer.`);
  return BigInt(value);
};
try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      length: { type: "string" },
      alphabet: { type: "string" },
      characters: { type: "string" },
      count: { type: "string" },
      generated: { type: "string" },
      active: { type: "string" },
      guesses: { type: "string" },
      risk: { type: "string" },
      min: { type: "string" },
      max: { type: "string" },
      tiny: { type: "boolean" },
      json: { type: "boolean" },
      help: { type: "boolean" },
      version: { type: "boolean" }
    }
  });
  if (values.help) {
    console.log(help);
  } else if (values.version) {
    console.log(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
  } else {
    const command = positionals[0] ?? "generate";
    if (positionals.length > 1) throw new TypeError("Only one command is accepted.");
    const flags = {
      generate: ["alphabet", "characters", "length", "tiny", "count", "json"],
      analyze: ["alphabet", "characters", "length", "generated", "active", "guesses", "json"],
      recommend: ["alphabet", "characters", "generated", "risk", "min", "max", "json"]
    };
    if (!Object.hasOwn(flags, command)) throw new TypeError(`Unknown command: ${command}`);
    for (const flag of Object.keys(values)) {
      if (!flags[command].includes(flag)) throw new TypeError(`--${flag} is not valid for ${command}.`);
    }
    const alphabet = { alphabet: values.alphabet, characters: values.characters };
    const common = { ...alphabet, length: values.length === void 0 ? 8 : Number(values.length) };
    if (command === "generate") {
      const next = createGenerator({ ...common, allowTiny: values.tiny ?? false });
      const result = next.batch(values.count === void 0 ? 1 : Number(values.count));
      console.log(values.json ? JSON.stringify(result) : result.join("\n"));
    } else if (command === "analyze") {
      const result = analyzeSpace({
        ...common,
        generatedCount: whole(values.generated ?? "0", "generated"),
        activeCodes: whole(values.active ?? "0", "active"),
        guesses: whole(values.guesses ?? "0", "guesses")
      });
      console.log(JSON.stringify(result, null, values.json ? 0 : 2));
    } else if (command === "recommend") {
      const result = recommendLength({
        ...alphabet,
        generatedCount: whole(values.generated ?? "0", "generated"),
        maxCollisionProbability: Number(values.risk ?? "0.000001"),
        minLength: Number(values.min ?? "4"),
        maxLength: Number(values.max ?? "15")
      });
      console.log(JSON.stringify(result, null, values.json ? 0 : 2));
      if (!result.feasible) process.exitCode = 2;
    } else {
      throw new TypeError(`Unknown command: ${command}`);
    }
  }
} catch (error) {
  console.error(`nanohash: ${error.message}`);
  process.exitCode = 1;
}
//# sourceMappingURL=cli.js.map
