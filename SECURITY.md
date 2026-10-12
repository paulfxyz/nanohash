# Security policy

nanohash is a compact public-identifier library, not an authorization or secret-token system. The current supported release line is 0.2.x; please still report security issues observed in earlier releases.

## Report privately

Use GitHub's “Report a vulnerability” action in this repository's Security tab when available. If private reporting is unavailable, contact the maintainer through the GitHub profile to arrange a private channel before sending exploit details.

Do not include real tokens, customer destinations, or personal data in a public issue. Provide the affected version, runtime, minimal reproduction, and expected versus observed behavior.

## Review boundary

Automated tests are not an independent cryptographic audit. Read [the security model](docs/security.md) for the generator, sizing, storage-adapter, and cancellation boundaries.
