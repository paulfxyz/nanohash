# Application integration

nanohash owns generation, sizing, and a narrowly scoped allocation loop. Your application owns destination validation, authorization, persistence, routing, auditing, and lifecycle management.

## PostgreSQL allocation recipe

Use a unique constraint and an atomic insert, not a preflight existence query. The following adapter expects an application-supplied `pg`-compatible client; this package does not include a database driver.

```sql
CREATE TABLE short_links (
  code text PRIMARY KEY,
  destination_url text NOT NULL,
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

```js
import { createGenerator, claimUnique } from "@paulfxyz/nanohash";

export async function allocateLink(client, validatedUrl, reservedRoutes) {
  return claimUnique({
    generate: createGenerator({ length: 8 }),
    isReserved: code => reservedRoutes.has(code),
    claim: async code => {
      const result = await client.query(
        `INSERT INTO short_links (code, destination_url)
         VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING
         RETURNING code, destination_url`,
        [code, validatedUrl]
      );
      return result.rowCount === 1
        ? { status: "claimed", value: result.rows[0] }
        : { status: "conflict" };
    }
  });
}
```

This is an allocation recipe, not a complete production link service. Add application validation, staff/machine authentication, authorization, rate limits, request idempotency, and transactional audit records before exposing a create endpoint.

For a caller-specified vanity code, attempt that exact code once and report a conflict. Do not silently substitute a random value, and do not reuse old campaign codes for unrelated targets.

## React plus a server-side resolver

Keep React responsible for the admin interface, not the redirect itself. A short link should resolve through an HTTP response before an SPA fallback, without requiring JavaScript.

```text
admin UI / authorized API / MCP
              |
         shared service
      validate / authorize
              |
       atomic mapping store
              |
visitor -> resolver -> temporary redirect
```

Preserve existing app routes and reserve their names. If your application owns a broad `/:slug` namespace, use `/r/<code>` or explicitly carve out the short-code namespace instead of guessing which route should win.

A typical resolver contract is GET/HEAD only, temporary redirects, `404` for unknown codes, `410` for disabled/expired codes, and `503` on storage failure. Set explicit `Cache-Control: no-store` and verify the actual proxy/CDN path before claiming edits or disables take immediate effect.

HTTP defines `302`/`307` as temporary and `301`/`308` as permanent; `307` preserves the request method, so a link service should reject unsupported methods rather than forwarding request bodies to arbitrary sites ([HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html)). Do not use a public `?url=` parameter to override the stored target, as unvalidated redirects can be abused for phishing ([OWASP redirect guidance](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)).

## API and MCP boundaries

Expose the same application service through each management surface. Suggested operations are create, get, list, update destination, and disable, with separate permissions for each relevant role.

- **No direct browser database keys:** Browser clients call the authorized application API.
- **No arbitrary configuration execution:** Accept validated settings and link data, not executable scripts from callers.
- **No bypass through agents:** MCP tools use the same destination policy, code reservations, version checks, and audit trail.
- **Review live changes:** Show the exact existing and proposed destination for updates to shared links.
- **Idempotency:** Persist operation keys and results at the application layer; a retry helper alone cannot solve a lost network response after a successful commit.

Remote MCP servers must validate token audiences and must not pass client tokens through indiscriminately to upstream services ([MCP authorization security](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations)). None of these authentication requirements is implemented by the identifier library itself.

## Workers and other stores

The built ESM generator uses Web Crypto and has no Node-only imports. Worker storage adapters can implement the same atomic claim contract, but provider-specific deployment is an application concern and is not certified by the browser smoke tests.

Avoid choosing an eventually consistent store as the only authority for time-sensitive revocation; Cloudflare explicitly describes Workers KV as eventually consistent ([Workers KV consistency](https://developers.cloudflare.com/kv/reference/faq/)). Choose a primary/authoritative read path and a real atomic uniqueness mechanism for your specific database.
