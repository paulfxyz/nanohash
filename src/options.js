export const ALPHABETS = Object.freeze({
  base36: "0123456789abcdefghijklmnopqrstuvwxyz",
  base62: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  url64: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-",
  human32: "0123456789abcdefghjkmnpqrstvwxyz"
});

export const PRESETS = Object.freeze({
  link: Object.freeze({ alphabet: "base36", length: 8 }),
  tiny: Object.freeze({ alphabet: "base36", length: 5 }),
  dense: Object.freeze({ alphabet: "url64", length: 8 }),
  long: Object.freeze({ alphabet: "base36", length: 12 }),
  human: Object.freeze({ alphabet: "human32", length: 8 })
});

export function objectOptions(value, allowed) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Options must be an object.");
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown option: ${key}`);
  }
  return value;
}

export function integer(value, name, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer from ${min} to ${max}.`);
  }
  return value;
}

export function resolveAlphabet({ alphabet, characters } = {}) {
  if (alphabet !== undefined && characters !== undefined) {
    throw new TypeError("Choose alphabet or characters, not both.");
  }
  if (characters !== undefined) {
    if (typeof characters !== "string" || !/^[A-Za-z0-9_-]{2,64}$/.test(characters)) {
      throw new TypeError("Custom characters must contain 2–64 distinct URL-safe ASCII symbols.");
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

export function resolveGenerator(options = {}, enforceTiny = true) {
  objectOptions(options, ["preset", "alphabet", "characters", "length", "allowTiny"]);
  if (options.preset !== undefined && !Object.hasOwn(PRESETS, options.preset)) {
    throw new TypeError(`Unknown preset: ${String(options.preset)}`);
  }
  if (options.preset !== undefined && (options.alphabet !== undefined || options.characters !== undefined)) {
    throw new TypeError("Choose preset or alphabet/characters, not both.");
  }
  if (options.allowTiny !== undefined && typeof options.allowTiny !== "boolean") {
    throw new TypeError("allowTiny must be a boolean.");
  }
  const preset = options.preset === undefined ? null : PRESETS[options.preset];
  const resolved = resolveAlphabet({
    alphabet: preset?.alphabet ?? options.alphabet,
    characters: options.characters
  });
  const length = integer(options.length ?? preset?.length ?? 8, "length", 4, 15);
  if (enforceTiny && length < 6 && options.allowTiny !== true) {
    throw new RangeError("Lengths 4–5 require allowTiny: true. Compact codes are not access secrets.");
  }
  return Object.freeze({
    ...resolved,
    length,
    alphabetSize: resolved.characters.length,
    entropyBits: length * Math.log2(resolved.characters.length),
    tiny: length < 6
  });
}

export function count(value, name, fallback = 0n) {
  if (value === undefined) return fallback;
  if (typeof value === "bigint" && value >= 0n) return value;
  if (Number.isSafeInteger(value) && value >= 0) return BigInt(value);
  throw new RangeError(`${name} must be a non-negative safe integer or bigint.`);
}
