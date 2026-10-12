# Contributing to nanohash

Contributions should make compact public identifiers easier to choose and safer to integrate. Prefer small, testable changes over expanding the project into a hosted link platform.

## Development

Use Node 22 or later and the committed npm lockfile. The source is plain JavaScript with explicit TypeScript declarations.

```sh
npm ci
npm run check
npm run pack:check
npx playwright install chromium
npm run test:e2e
```

Run `npm run build` after source or declaration changes and commit the resulting `dist/` files. Browser changes also need light/dark/mobile QA and updated screenshots when the visible interface changes.

If bundle output changes, use Node 22 to run `npm run size` and commit the generated report, README tables, and size badges together. `npm run size:check` verifies that the published numbers match the current build.

## Contribution boundaries

- **Randomness:** No `Math.random` fallback, home-grown RNG, hidden seed mode, or unsupported security claim.
- **Compatibility:** Test imports and actual consumer installs, not just development source paths.
- **Analysis:** State assumptions and approximation limits; add mathematical test cases.
- **Allocation:** Keep database adapters explicit and storage-agnostic; do not retry arbitrary errors.
- **Scope:** No analytics SDK, backend credential, production customer data, or network request in the core library.

Use descriptive commits and include tests and documentation for behavior changes. Do not submit security vulnerabilities through public issues; follow [SECURITY.md](SECURITY.md).

## License

Contributions are submitted under the repository's MIT license. Preserve third-party notices when copying or bundling upstream material.
