#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFileSync } from "node:fs";
import { createGenerator, analyzeSpace, recommendLength } from "./index.js";

const help = `nanohash: compact random IDs, sized honestly

Usage:
  nanohash [generate] [--length 8] [--alphabet base36] [--count 5]
  nanohash analyze --length 8 --generated 100000
  nanohash recommend --generated 100000 --risk 0.000001

Options:
  --alphabet     base36, base62, url64, or human32
  --characters   Custom distinct URL-safe ASCII alphabet (instead of --alphabet)
  --length       Integer from 4 to 15
  --tiny         Explicit opt-in for generating 4–5 character public codes
  --count        Generate 1–10000 candidates (default 1)
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

const whole = (value, name) => {
  if (!/^\d+$/.test(value)) throw new TypeError(`${name} must be a non-negative integer.`);
  return BigInt(value);
};

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      length: { type: "string" }, alphabet: { type: "string" },
      characters: { type: "string" }, count: { type: "string" },
      generated: { type: "string" }, active: { type: "string" },
      guesses: { type: "string" }, risk: { type: "string" },
      min: { type: "string" }, max: { type: "string" },
      tiny: { type: "boolean" }, json: { type: "boolean" },
      help: { type: "boolean" }, version: { type: "boolean" }
    }
  });
  if (values.help) {
    console.log(help);
  } else if (values.version) {
    console.log(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
  } else {
    const command = positionals[0] ?? "generate";
    if (positionals.length > 1) throw new TypeError("Only one command is accepted.");
    const alphabet = { alphabet: values.alphabet, characters: values.characters };
    const common = { ...alphabet, length: values.length === undefined ? 8 : Number(values.length) };
    if (command === "generate") {
      const next = createGenerator({ ...common, allowTiny: values.tiny ?? false });
      const result = next.batch(values.count === undefined ? 1 : Number(values.count));
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
