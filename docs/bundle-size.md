# Bundle size, without the fine-print trick

nanohash provides a full toolkit and a separate generation-only lite entry, not a single 130-byte package. This page records what is measured, what is included, and how to reproduce the size badges in the README.

## Current measurements

<!-- nanohash:size-summary:start -->
The separate lite generator is **579 bytes minified + gzip**; the full generator factory is **1,369 bytes**, and the full toolkit's root browser API is **2,707 bytes**, under the same minified + gzip settings. These measurements include the bundled Nano ID implementation, not just a wrapper.
<!-- nanohash:size-summary:end -->

<!-- nanohash:size-table:start -->
| Import surface | Minified JS | Minified + gzip | Minified + Brotli |
|---|---:|---:|---:|
| Lite generator | 949 B | 579 B | 509 B |
| Generator factory | 3,171 B | 1,369 B | 1,216 B |
| nanohash() shorthand | 3,213 B | 1,385 B | 1,235 B |
| Analysis entry point | 3,681 B | 1,532 B | 1,331 B |
| Allocation entry point | 2,092 B | 969 B | 841 B |
| Full toolkit (root API) | 6,821 B | 2,707 B | 2,384 B |
<!-- nanohash:size-table:end -->

The full machine-readable report is in [size-report.json](size-report.json). It records the exact import stubs, toolchain settings, source fingerprint, and raw unminified distribution sizes.

## What the numbers mean

- **Minified JS:** A bundled browser ESM build retaining the indicated exports.
- **Minified + gzip:** That output compressed with gzip level 9; the gzip wrapper is included.
- **Minified + Brotli:** The same output compressed with Brotli quality 11.
- **Bundled implementation:** Nano ID's code is included wherever the selected entry uses it.
- **Tree-shaking:** Import-specific rows discard unneeded exports; the full-toolkit row retains all root-package exports, with lite measured separately.

The benchmark excludes the CLI, declarations, source maps, fonts, screenshots, documentation, HTTP headers, and separately distributed license notices. It does not measure npm tarball size, installed disk use, parse time, memory, or runtime performance.

Required license notices remain in the actual distribution. Removing comments for an apples-to-apples compression benchmark is not permission to remove licensing obligations.

## Comparison with Nano ID

The [Nano ID CJS README](https://github.com/zlocate/nanoid-cjs) describes a **130-byte minified-and-gzipped generator**, not its complete repository or all possible custom-alphabet usage. Its historical number is not automatically reproducible with a newer Nano ID version, a different bundler, different retained exports, or different compression settings.

For context, the following rows build the installed Nano ID 6.0.2 and nanohash under the same settings. They are different feature sets, not a claim of an equivalent feature-for-feature competition.

<!-- nanohash:baseline-table:start -->
| Same build settings, different scope | Minified JS | Minified + gzip |
|---|---:|---:|
| Nano ID default primitive | 198 B | 208 B |
| Nano ID Base36 / 8 primitive | 477 B | 326 B |
| Lite generator | 949 B | 579 B |
| Generator factory | 3,171 B | 1,369 B |
| Full toolkit (root API) | 6,821 B | 2,707 B |
<!-- nanohash:baseline-table:end -->

The default Nano ID primitive uses its own defaults, while the Base36/eight-character primitive is closer to nanohash's default output shape. Lite adds length checks, strict options, the tiny-code gate, and fail-closed handling to that primitive; the full toolkit adds the richer APIs.

Gzip can make a very small file slightly larger because its framing adds overhead. These results do not disprove an upstream project's older size claim; they document this project's own pinned measurement.

## Reproduce

Run from a clean install with Node 22. The lockfile pins the build tools and Nano ID dependency used by this report.

```sh
npm ci
npm run build
npm run size
npm run size:check
```

The script uses esbuild with `bundle`, `minify`, and `treeShaking` enabled, browser ESM output, ES2022 target, no source maps, and `legalComments: "none"`. It then applies gzip level 9 and Brotli quality 11, regenerating the JSON report and the marked README/documentation blocks.

A dedicated Node 22 CI job checks the numbers, badges, and generated tables against the current build, including the lite reference page. It also enforces a 750-byte minified-plus-gzip ceiling for lite; Node 22 is the measurement reference, not a narrower library runtime limit.

## Claims we can make

- **Measured and scoped:** “Generator factory: [the recorded byte count] minified + gzip, including bundled Nano ID.”
- **Lite-specific:** “Lite generator: [the recorded byte count] minified + gzip, including secure generation and runtime validation.”
- **Feature-aware:** “A compact toolkit with separate generation, analysis, and allocation import surfaces.”
- **Dependency-accurate:** “No runtime npm dependencies; secure Nano ID code is bundled.”

Do not say “130 bytes,” “a few bytes for everything,” “smaller than Nano ID,” “zero third-party code,” or “zero collision risk.” The lite number belongs only to its separate import and must not be reused as the size of the full toolkit or a bundle combining multiple entry points.
