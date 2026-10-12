# Changelog

## 0.2.0

Additive release introducing a separate lite generator while preserving the existing root toolkit's behavior and APIs. The v0.1.0 tag remains immutable, and npm publication remains a separate decision.

- **Lite entry:** `@paulfxyz/nanohash/lite` exports one secure, fixed-Base36 generator with a default length of 8 and an explicit acknowledgement for lengths 4–5.
- **Safety:** Integer length and option validation, no insecure RNG fallback, fail-closed Web Crypto handling, and propagated entropy-source failures.
- **Distribution:** Standalone lite ESM/CJS builds, TypeScript declarations for both module systems, browser coverage, a runnable example, and clean-consumer installation checks.
- **Size limit:** Separately measured lite output with a 750-byte minified-plus-gzip ceiling enforced by CI; no lite code is added to existing root imports.
- **README:** Theme-aware logo and screenshots, flat status/compatibility badges, navigation, expanded use cases, integration diagram, documentation map, and FAQ.
- **Size claims:** Reproducible import-specific browser bundle measurements, generated gzip badges, baseline comparisons, and a CI drift check.
- **Metadata:** Expanded package keywords and a clearer project description without unverified size or security claims.

## 0.1.0

Initial public GitHub release of nanohash. The scoped package identity is `@paulfxyz/nanohash`; npm publication is separate.

- **Generator:** Configurable 4–15 character IDs using Nano ID secure randomness, four alphabets, custom characters, five presets, and explicit tiny-code acknowledgement.
- **Analysis:** Exact namespace sizes, random-bit estimates, birthday and guessing models, and bounded length recommendations.
- **Allocation:** Storage-agnostic atomic-claim contract, reserved-code checks, bounded conflict retries, and documented cancellation behavior.
- **Distribution:** ESM/CommonJS builds, TypeScript declarations for both module systems, CLI, and committed release artifacts.
- **Playground:** Interactive generation, collision sizing, custom alphabets, batch copy, responsive layout, and light/dark themes.
- **Documentation:** API, sizing, integration, compatibility, security, contribution, QA, and release guides with original graphics and real screenshots.
