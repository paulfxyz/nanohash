# Release procedure

GitHub releases and npm publication are separate operations. The current package identity is `@paulfxyz/nanohash`; the unscoped npm name `nanohash` must not be used for this project.

## Before tagging

```sh
npm ci
npm run check
npm run pack:check
npm run size:check
npx playwright install chromium
npm run test:e2e
npm run site:build
git diff --exit-code -- dist
```

Review the lockfile, bundled dependency license notices, API changes, and any files entering the public repository. Do not commit production link mappings, real customer data, tokens, local environment files, or private deployment details.

Use Node 22 for the reference size check, and rerun `npm run size` if the build changed. Never carry an old size badge into a new release without measuring it.

## Documentation and visuals

Keep the version in `package.json`, lockfile, release notes, CLI version tests, README install command, and playground install command synchronized. A version bump must not leave the README pointing at the previous package.

```sh
npm run site:serve
# In another terminal:
npm run assets
```

Inspect light/dark/mobile screenshots before committing them. Confirm runtime support statements match the environments actually tested.

## GitHub release

Tag an approved commit and publish release notes for that exact version. GitHub's source archives contain the committed builds; attaching an additional `npm pack` tarball is optional and depends on the publishing channel supporting binary uploads.

Do not move an already published version tag to different code. Issue a new version for corrections, and synchronize the package version, README, playground install command, and repository description.

```sh
VERSION=$(node -p "require('./package.json').version")
git tag -a "v$VERSION" -m "nanohash v$VERSION"
git push origin main "v$VERSION"
gh release create "v$VERSION" \
  --repo paulfxyz/nanohash \
  --verify-tag \
  --title "nanohash v$VERSION" \
  --notes-file CHANGELOG.md
```

## Optional npm publication

Confirm control of the `@paulfxyz` npm scope and registry availability before publication. The GitHub username alone does not establish ownership of an npm account or scope.

Use the registry's supported secure publishing workflow, retain package provenance where supported, and require appropriate maintainer protections. No npm token belongs in the repository, a README command, or a public workflow file.

Only publish after explicit approval of the package scope and release. Until then, document GitHub installation honestly and do not imply the scoped package can be installed from npm.
