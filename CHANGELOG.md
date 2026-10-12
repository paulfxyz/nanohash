# Changelog

## Unreleased

Documentation and repository presentation refresh; no runtime API changes. The existing v0.1.0 tag remains immutable.

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
