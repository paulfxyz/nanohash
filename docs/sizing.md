# Sizing compact identifiers

Length is a product choice with mathematical consequences. nanohash reports these consequences without turning them into a misleading “security score.”

## Character space and random bits

For a uniform alphabet with `A` symbols and length `L`, the model is:

```text
N = A^L
random bits = L × log2(A)
```

| Length | Base36 bits | URL64 bits |
|---:|---:|---:|
| 4 | 20.68 | 24 |
| 5 | 25.85 | 30 |
| 6 | 31.02 | 36 |
| 8 | 41.36 | 48 |
| 10 | 51.70 | 60 |
| 12 | 62.04 | 72 |
| 15 | 77.55 | 90 |

These values assume independent uniform characters. Manual vanity codes, filtered outputs, fixed prefixes, and transformations such as lowercasing a mixed-case code do not preserve those assumptions.

## The birthday approximation

The chance of at least one duplicate among `n` independent candidates is approximated by:

```text
P(any duplicate) ≈ 1 − exp(−n(n−1) / (2N))
```

This is the model used for collision analysis; the [Nano ID collision calculator](https://zelark.github.io/nano-id-cc/) is another way to explore the same sizing concern. nanohash uses `expm1` to avoid losing very small probabilities through subtraction.

| Format | Candidate draws | Approximate probability of any duplicate |
|---|---:|---:|
| 6 characters, Base36 | 100,000 | 89.94% |
| 8 characters, Base36 | 100,000 | 0.177% |
| 8 characters, Base62 | 100,000 | 0.00229% |

These are probabilities across an entire draw sequence, not a per-request failure rate. Atomic allocation rejects duplicate candidates and retries; it does not make the original random draws collision-free.

The birthday expression is an approximation, particularly for small spaces and dense occupancy. The implementation reports 0 for fewer than two draws and 1 when the number of draws exceeds the available space; it does not claim an exact finite-space calculation at other points.

## Guessing is a different question

If `m` codes are active and an attacker makes `q` independent uniform guesses:

```text
P(hit any active code) = 1 − (1 − m/N)^q
```

Use `m = 1` to model a specific target rather than any valid code. Real attacks, non-uniform aliases, prior observations, and enumeration behavior can violate the model.

Four Base36 characters give 1,679,616 possible strings. With 1,000 active targets, one uniform guess has about a 1-in-1,680 chance of finding some target, so “random” is not a good privacy boundary.

## Choose a budget, then a length

`recommendLength` models candidate collisions only. It does not decide whether the identifier should carry access authority or whether your endpoint is sufficiently rate-limited.

```js
recommendLength({
  alphabet: "base36",
  generatedCount: 100_000,
  maxCollisionProbability: 1e-6,
  minLength: 4,
  maxLength: 15
});
// feasible: true, length: 11
```

If the budget cannot be met, increase the namespace or revise the requirement rather than silently claiming that length 15 is enough. Keep authorization separate regardless of the selected length.

## Boundaries

- **Exact size, approximate risk:** Namespace size is computed with `BigInt`; bits and probabilities use JavaScript floating-point arithmetic.
- **Generation versus allocation:** `generatedCount` counts hypothetical independent candidate draws, not successful unique inserts after retries.
- **Lifetime versus active:** Tombstoned and expired codes may stay reserved for allocation even when no longer active targets.
- **Filtering:** Reserved routes and blocklists reduce the effective namespace and can affect the distribution.
- **Tokens:** Fifteen URL64 symbols provide 90 bits, below 128; this compact range is not a general-purpose bearer-token design.
