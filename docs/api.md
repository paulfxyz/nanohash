# API reference

The primary entry point exports generation, sizing, and allocation helpers. Analysis and allocation also have separate entry points so callers do not need to import the random generator.

## `nanohash(length = 8)`

Return one Base36 candidate using secure randomness. `length` must be an integer from 6 through 15 for this shorthand; use `createGenerator({ length: 4, allowTiny: true })` for intentionally tiny codes.

```js
import { nanohash } from "@paulfxyz/nanohash";
const candidate = nanohash(10);
```

## `createGenerator(options = {})`

Return a frozen callable generator with `config` and `batch(count = 10)`. Options are validated strictly; unknown keys are errors rather than silently ignored configuration.

| Option | Type/default | Behavior |
|---|---|---|
| `preset` | `link`, `tiny`, `dense`, `long`, `human`; omitted | Select preset alphabet/length; cannot coexist with `alphabet` or `characters` |
| `alphabet` | `base36`, `base62`, `url64`, `human32`; `base36` | Select a named alphabet |
| `characters` | String; omitted | Custom 2–64 distinct ASCII URL-safe symbols; cannot coexist with `alphabet` |
| `length` | Integer 4–15; preset length or 8 | Override length |
| `allowTiny` | Boolean; `false` | Required to generate lengths 4 or 5 |

The returned `config` contains `alphabet` (or `null` for custom characters), `characters`, `alphabetSize`, `length`, `entropyBits`, and `tiny`. These values describe the generator; they do not report database occupancy or authorization strength.

```js
const next = createGenerator({ preset: "long", length: 15 });
next();               // one candidate
next.batch(25);       // 25 candidates, not deduplicated
next.config.length;  // 15
```

`batch` accepts integer counts from 1 through 10,000. It deliberately does not promise uniqueness within the batch or across calls.

## `validateCode(value, options = {})`

Return whether a string has the configured length and contains only the configured characters. Invalid configuration throws; an invalid candidate returns `false`.

This performs format validation only and does not require a tiny-code opt-in. It does not prove the string was randomly generated, exists in storage, belongs to anyone, or grants access.

## `ALPHABETS` and `PRESETS`

Both are frozen exported records. The exact strings below are part of the public contract.

| Alphabet | Characters |
|---|---|
| `base36` | `0123456789abcdefghijklmnopqrstuvwxyz` |
| `base62` | `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ` |
| `url64` | `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-` |
| `human32` | `0123456789abcdefghjkmnpqrstvwxyz` |

## `analyzeSpace(options = {})`

Available from the main entry or `@paulfxyz/nanohash/analysis`. Accepts `alphabet` or `characters`, integer `length` 4–15, and three non-negative counts.

| Count | Meaning |
|---|---|
| `generatedCount`, default 0 | Independent candidate draws for the birthday approximation |
| `activeCodes`, default 0 | Active target codes for the guessing model; cannot exceed the space |
| `guesses`, default 0 | Independent guesses in the guessing model |

Counts accept safe-integer numbers or non-negative `bigint` values. Numeric strings and unsafe JavaScript numbers are rejected to prevent silent precision loss.

| Returned field | Meaning |
|---|---|
| `space` | Exact decimal string computed with `BigInt` |
| `entropyBits` | Floating-point `length * log2(alphabetSize)` |
| `collisionProbability` | Birthday approximation, before storage retries; 0–1 |
| `anyHitProbability` | Chance of hitting any active code under the independent uniform guessing model; 0–1 |
| `generatedCount`, `activeCodes`, `guesses` | Decimal strings, safe for JSON serialization |
| `alphabet`, `alphabetSize`, `length` | Configuration used |
| `assumptions` | Explicit modeling limitations |

Results are frozen and JSON-safe. They are estimates, not a cryptographic or statistical certification.

## `recommendLength(options = {})`

Search the inclusive 4–15 length range, or supplied `minLength`/`maxLength`, for the smallest length within a collision-probability budget. Accepts `alphabet` or `characters`, `generatedCount`, and `maxCollisionProbability` strictly between 0 and 1; the default budget is `0.000001`.

```js
{ feasible: true, length: 11, maxCollisionProbability: 0.000001, analysis }
// or
{ feasible: false, length: null, maxCollisionProbability, analysis, reason }
```

An infeasible result contains analysis at `maxLength`. A recommendation can return four or five characters, but actually generating that length still requires a separate `allowTiny: true` acknowledgement.

## `claimUnique(options)`

Available from the main entry or `@paulfxyz/nanohash/allocation`. Returns a promise for `{ code, value, attempts }` after a storage adapter reports a successful claim.

| Option | Contract |
|---|---|
| `generate` | Required synchronous function returning a 4–15 character URL-safe candidate |
| `claim` | Required sync/async callback returning `{ status: "claimed", value }` or `{ status: "conflict" }` |
| `isReserved` | Optional sync/async boolean callback; reserved candidates consume an attempt |
| `maxAttempts` | Integer 1–1,000; default 5 |
| `signal` | Optional `AbortSignal`, checked before generating and before starting a claim |

The claim callback must atomically insert or reserve the code under a storage uniqueness constraint. Database errors propagate unchanged; only explicit conflicts and reserved candidates are retried.

Cancellation does not roll back an in-flight database call. If a claim commits while the signal is cancelled, success is returned so the caller is not misled into creating a duplicate allocation; use application-level idempotency keys for request retries.

## `AllocationExhaustedError`

Thrown after all allocation attempts are consumed without a successful claim. The error exposes `name === "AllocationExhaustedError"` and an `attempts` count.

## CLI contract

Use the installed package's `nanohash` binary. Unknown flags, invalid numeric values, incompatible command-specific flags, and unknown commands fail with a concise error message.

| Command | Options |
|---|---|
| `generate` or no command | `--length`, `--alphabet` or `--characters`, `--count`, `--tiny`, `--json` |
| `analyze` | `--length`, `--alphabet` or `--characters`, `--generated`, `--active`, `--guesses`, `--json` |
| `recommend` | `--alphabet` or `--characters`, `--generated`, `--risk`, `--min`, `--max`, `--json` |

Exit status is 0 on success, 1 for invalid input or runtime failure, and 2 for an infeasible recommendation. `--help` and `--version` are global informational operations.
