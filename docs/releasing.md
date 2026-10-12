# Release procedure

GitHub releases and npm publication are separate operations. Version 0.1.0 is designed for a public GitHub release; the unscoped npm name `nanohash` must not be used for this package.

## Before tagging

```sh
npm ci
npm run check
npm run pack:check
npx playwright install chromium
npm run test:e2e
npm run site:build
git diff --exit-code -- dist
```

Review the lockfile, bundled dependency license notices, API changes, and any files entering the public repository. Do not commit production link mappings, real customer data, tokens, local environment files, or private deployment details.

## Documentation and visuals

Keep the version in `package.json`, lockfile, release notes, CLI version tests, README install command, and playground install command synchronized. A version bump must not leave the README pointing at the previous package.

```sh
npm run site:serve
# In another terminal:
npm run assets
```

Inspect light/dark/mobile screenshots before committing them. Confirm runtime support statements match the environments actually tested.

## GitHub release

Tag an approved commit and attach the tarball produced by `npm pack`. Do not move an already published version tag to different code; issue a new patch release for corrections.

```sh
git tag v0.1.0
git push origin main v0.1.0
gh release create v0.1.0 paulfxyz-nanohash-0.1.0.tgz \
  --repo paulfxyz/nanohash \
  --title "nanohash v0.1.0" \
  --notes-file CHANGELOG.md
```

## Optional npm publication

Confirm control of the `@paulfxyz` npm scope and registry availability before publication. The GitHub username alone does not establish ownership of an npm account or scope.

Use the registry's supported secure publishing workflow, retain package provenance where supported, and require appropriate maintainer protections. No npm token belongs in the repository, a README command, or a public workflow file.

Only publish after explicit approval of the package scope and release. Until then, document GitHub installation honestly and do not imply the scoped package can be installed from npm.
