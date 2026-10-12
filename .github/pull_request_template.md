## Change

Describe the behavior being changed and why it belongs in the library. Note any API or compatibility impact.

## Verification

- [ ] `npm run check`
- [ ] `npm run pack:check`
- [ ] `npm run size:check` on Node 22, with lite within its size ceiling
- [ ] Built `dist/` committed
- [ ] Documentation and declarations updated
- [ ] Browser changes checked with `npm run test:e2e`
- [ ] No new security claims, unsafe RNG fallback, secrets, or private data
