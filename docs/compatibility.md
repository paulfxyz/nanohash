# Runtime and packaging compatibility

The supported Node baseline is version 22. Browser generation requires a secure context with `crypto.getRandomValues`, and analysis helpers require `BigInt`.

## Distribution layout

| Entry | ESM | CommonJS | TypeScript |
|---|---|---|---|
| Main | `dist/index.js` | `dist/index.cjs` | `.d.ts` and `.d.cts` |
| Lite | `dist/lite.js` | `dist/lite.cjs` | `.d.ts` and `.d.cts` |
| Analysis | `dist/analysis.js` | `dist/analysis.cjs` | `.d.ts` and `.d.cts` |
| Allocation | `dist/allocation.js` | `dist/allocation.cjs` | `.d.ts` and `.d.cts` |
| CLI | `dist/cli.js` | Not applicable | Not applicable |

Conditional exports select the correct runtime and declaration entry. The package includes committed builds and no install-time lifecycle script; consumers can install a tagged GitHub release without building development dependencies.

The lite entry is independent of the main entry and is not re-exported from it. Adding lite does not change the existing full-toolkit APIs or add lite code to an existing main-package browser import.

## Nano ID and CommonJS

The secure generator implementation is bundled rather than leaving a CommonJS entry point dependent on a potentially ESM-only upstream import. The upstream MIT notice is retained in the package and documented in `THIRD_PARTY_NOTICES.md`.

This is a packaging choice, not a forked cryptographic algorithm. Dependency updates must rebuild and retest both output formats.

## Tested and prospective environments

- **Node:** CI is configured for current even-numbered versions 22, 24, and 26, with ESM, CommonJS, CLI, clean tarball installation, and declarations tested.
- **Chromium:** The playground and standalone lite ESM distribution are tested in desktop and mobile contexts; mobile emulation is not a claim of physical-device certification.
- **Other browsers:** Modern browsers with required platform APIs are intended targets, but Safari/Firefox are not certified by the initial Chromium-only suite.
- **Workers:** The browser build avoids Node imports and is intended for Web Crypto runtimes; validate the actual worker provider before production.
- **React Native:** Not supported by default; no randomness polyfill is installed or silently assumed.

## Reproducibility

`npm run build` recreates JavaScript, source maps, executable CLI, and both declaration formats. CI checks that committed distributions match the source before a release is accepted.

`npm run pack:check` installs the real tarball into a clean temporary consumer and exercises import, require, subpath imports, and the CLI. It also checks required files and excludes obvious environment-secret files.
