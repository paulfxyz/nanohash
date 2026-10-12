# QA inventory

This checklist connects implemented behavior to test coverage and screenshot evidence. It records the release process rather than claiming an independent security audit.

## Automated library checks

- **Generation:** Every length from 4 through 15 with all four built-in alphabets; custom alphabets; explicit tiny acknowledgement.
- **Validation:** Invalid lengths, duplicate characters, unsupported symbols, unknown options, conflicting configurations, and format-only validation.
- **Failure safety:** Missing Web Crypto fails closed; there is no insecure RNG fallback.
- **Probability model:** Exact BigInt spaces, known birthday examples, separate guessing estimates, zero counts, full occupancy, extreme counts, and infeasible length budgets.
- **Allocation:** Reserved values, forced collisions, bounded attempts, concurrent claims, propagated storage failures, invalid adapters, and cancellation before/after commit.
- **Distribution:** ESM, CommonJS, subpaths, CLI, clean tarball installation, and both TypeScript module formats.
- **Lite:** Its separate ESM/CJS exports and declarations, every supported length, explicit tiny opt-in, invalid options, missing/failing Web Crypto, and absence of full-toolkit helpers in the bundle.
- **Lite randomness boundary:** A deterministic test verifies Nano ID's rejection of unusable Base36 bytes; this is a regression check, not a cryptographic audit.
- **Size ceiling:** Generated metrics and badges match the build, and lite stays within its 750-byte minified-plus-gzip limit.

## Standalone lite browser checks

Desktop and mobile Chromium import the actual standalone ESM file, not a test reimplementation. Checks cover format/length, tiny gating, invalid options, and failure when Web Crypto is removed from the isolated test context.

## Playground interaction checks

| Control or state | Check |
|---|---|
| Generate | Produces a new format-valid candidate and batch |
| Presets | Link, dense, human, long, and tiny settings match the library |
| Length slider | Bounds 4–15; keyboard interaction; displayed count and mathematics update |
| Alphabet selector | Named alphabets and custom characters stay synchronized |
| Invalid custom alphabet | Clear error, no stale usable output, recovery after correction |
| Batch count | 1, 5, 10, and 25 candidates fit without horizontal overflow |
| Tiny acknowledgement | Generation/copy blocked until checked; resets on configuration change |
| Copy actions | Success or honest clipboard-denied fallback |
| Expected draws | Correct estimates; invalid/empty values are recoverable |
| Risk budget | A real recommendation or explicit infeasibility |
| Use recommendation | Updates actual generation length without bypassing tiny acknowledgement |
| Theme | Light to dark and back with readable content |
| Links | Quick-start navigation and repository/documentation destinations |

## Visual checks

The initial desktop view should identify the tool, show the first candidate, and make generation controls obvious. On a phone, the page is intentionally scrollable rather than squeezing all controls and output into a fixed-height viewport.

- **Desktop:** Hero, workbench, sizing chart, and quick-start section.
- **Mobile:** 375-pixel layout, maximum-length codes, expanded batch, custom-alphabet input, and warning state.
- **Themes:** Light and dark versions of the actual generated interface.
- **Accessibility:** Native labels and controls, keyboard focus, status messages, reduced-motion support, and no page-wide horizontal overflow.
- **Failure states:** Bad alphabet, empty draw count, tiny-code gating, and clipboard denial.

## Image provenance

The README screenshots are captured from the real browser playground by `npm run assets`. The banner is original brand artwork rendered from `site/brand-card.html`, and the SVG marks are original project assets.

Random sample values in screenshots will differ on regeneration. No screenshot is evidence of a secret-token capability, benchmark result, or live production integration.
