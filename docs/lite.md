# nanohash/lite

`@paulfxyz/nanohash/lite` is a generation-only entry point for small public identifiers. It uses the same secure Nano ID primitive as the full toolkit, without importing presets, custom-alphabet configuration, batching, analysis, or allocation helpers.

## Install and use

Use the scoped package from its GitHub release, not the unrelated unscoped npm package. No npm publication is implied by this installation method.

```sh
npm install github:paulfxyz/nanohash#v0.2.0
```

```js
import { nanohash } from "@paulfxyz/nanohash/lite";

nanohash();                       // length 8
nanohash(12);                     // length 12
nanohash(4, { allowTiny: true });  // tiny public namespace, explicitly enabled
```

```js
const { nanohash } = require("@paulfxyz/nanohash/lite");
console.log(nanohash(10));
```

## Contract

Lite exports only `nanohash(length = 8, options = {})`. This two-argument signature is separate from the root toolkit's one-argument shorthand.

| Property | Behavior |
|---|---|
| Alphabet | Fixed lowercase Base36: `0123456789abcdefghijklmnopqrstuvwxyz` |
| Default length | 8 |
| Accepted length | Integer 4–15, without coercion or truncation |
| Tiny codes | 4–5 require `{ allowTiny: true }` |
| Options | Only `allowTiny?: boolean`; unsupported keys and invalid option types throw |
| Output | One random candidate string, not a uniqueness or authorization guarantee |
| Randomness | Bundled Nano ID secure custom-alphabet implementation |
| Runtime | Node 22+ or the documented browser environment with secure Web Crypto |
| Errors | `RangeError` for invalid/gated lengths; `TypeError` for invalid options; explicit error if Web Crypto is unavailable |

An error from the underlying random source propagates rather than triggering a fallback. A compromised runtime is outside the library's trust boundary; checking that Web Crypto exists cannot certify a caller-supplied replacement.

## Measured size

<!-- nanohash:lite-size:start -->
The lite-only browser bundle is **949 bytes minified**, **579 bytes minified + gzip**, and **509 bytes minified + Brotli**. CI enforces a **750-byte minified + gzip ceiling** and fails if the implementation exceeds it.
<!-- nanohash:lite-size:end -->

These browser ESM measurements include Nano ID's implementation and lite's runtime validation. They do not measure the npm archive, installed disk size, full toolkit, CLI, declarations, or documentation; the [complete methodology](bundle-size.md) records compression settings and exclusions.

The published ESM and CJS files also retain license references, with the full notices supplied in the distribution. The benchmark excludes license comments for consistency with the other measured import surfaces.

## What is deliberately absent

- **No custom alphabets or presets:** Use `createGenerator` from the root package for those.
- **No batch or factory API:** Lite produces one candidate per call.
- **No analysis or validation exports:** Import the relevant full-toolkit entry if you need those functions.
- **No storage or retry mechanism:** Your application must still atomically claim codes under a unique constraint.
- **No authorization:** A compact identifier does not protect a private resource.
- **No insecure RNG or new cryptography:** There is no `Math.random` fallback, seed option, or public RNG override.

The smaller bundle comes from a narrower API, not from removing secure randomness, length checks, or the tiny-code acknowledgement. Existing main-package imports retain their original behavior and do not include lite.

## Combine with allocation explicitly

The allocation helper accepts a synchronous candidate generator, so it can use lite. Importing that helper adds its own code and is not covered by the lite-only size claim.

```js
import { nanohash } from "@paulfxyz/nanohash/lite";
import { claimUnique } from "@paulfxyz/nanohash/allocation";

const result = await claimUnique({
  generate: () => nanohash(10),
  claim: code => storage.tryInsertCode(code)
});
```

`storage` is your application adapter and must return the documented atomic-claim result. See the [integration guide](integrations.md) for the concrete database recipe, rather than implementing an unsafe check-then-insert.

## Standalone browser module

The committed `dist/lite.js` is self-contained ESM. Serve it from your own static assets, alongside the distributed license notices, and import it as a module.

```html
<script type="module">
  import { nanohash } from "/vendor/nanohash/lite.js";
  console.log(nanohash());
</script>
```

The example path is chosen by your application; it is not a hosted CDN service. Chromium checks exercise the actual ESM distribution in desktop and mobile contexts, including missing-Web-Crypto behavior.
