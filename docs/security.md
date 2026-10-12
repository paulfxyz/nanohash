# Security model

nanohash creates compact public identifiers. It is not a password generator, access-token library, URL safety scanner, encryption scheme, or replacement for authorization.

## Secure randomness

Generation composes Nano ID's secure custom-alphabet implementation, which documents use of cryptographic randomness and avoidance of biased character selection ([Nano ID security](https://github.com/ai/nanoid)). The built browser/ESM/CJS generator requires Web Crypto and never downgrades to `Math.random`.

The API intentionally does not expose a custom RNG hook. Tests that force collisions inject a deterministic `generate` callback into the allocation helper, not an unsafe RNG into the public generator.

## Uniqueness and identity

The generator returns a candidate, not a globally unique fact. Scope uniqueness with a database primary/unique key and atomic insertion; if multiple tenants or hostnames have separate namespaces, include those fields in the uniqueness constraint.

Do not recycle retired identifiers into unrelated records. Previously shared URLs, caches, or printed materials may continue to reference them.

## Tiny codes

Generation at lengths four and five requires `allowTiny: true`. This is an acknowledgement, not an extra security control or a guarantee that rate limiting can compensate for a small namespace.

Even longer compact codes should not be the sole protection for private data. Enforce authorization at the referenced resource.

## Probability output

Analysis assumes independent uniform draws and does not model a capable adversary, leaked aliases, filtering, or a compromised runtime. Floating-point output and the birthday approximation are useful planning tools, not a cryptographic audit.

## Allocation and cancellation

The storage adapter is part of the application's trust boundary. It must report `"claimed"` only after the claim commits and `"conflict"` only for an actual code conflict; connectivity errors, validation failures, and other uniqueness violations must not be relabeled as collisions.

A signal can stop future attempts but does not cancel or roll back an already-running callback. A successful in-flight claim is returned even if cancellation arrives, preventing the helper from concealing a committed operation.

## Destination and deployment safety

- **Authorization:** Keep write privileges on the server and apply them independently to UI, API, and MCP entry points.
- **Redirect policy:** Parse and validate destinations; default to approved public HTTPS targets and reject ambiguous schemes/userinfo/control characters.
- **No previews by default:** A later server-side destination fetcher requires a separately designed SSRF and egress policy.
- **Caches:** Test edits, expiration, disable actions, and negative caching through every cache layer.
- **Logging:** Avoid putting secrets or sensitive destination query strings into ordinary logs.
- **Public demos:** The playground does not publish mappings or redirect traffic; it only generates candidates and performs calculations.

## Review status and reporting

The project has automated contract, packaging, and browser tests. It has not undergone an independent security audit and makes no “unbreakable,” “collision-free,” or audited-security claims.

See [SECURITY.md](../SECURITY.md) for private disclosure guidance. Never post real secrets, exploit tokens, or customer URLs in a public issue.
