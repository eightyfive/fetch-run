# v3 README rewrite

## Goal

Replace the existing README with a shorter, v3-accurate guide that helps a
consumer install `fetch-run`, make their first JSON request with `Api`, and
understand the middleware model without reading the source.

## Scope

- Rewrite `README.md` rather than incrementally editing its legacy content.
- Keep `Api` as the default recommendation and use TypeScript in all examples.
- Include a complete quick-start example with optional `logger` and `error`
  middleware.
- Explain middleware composition, LIFO execution order, and why logger must be
  registered before error handling.
- Document the public request methods and the bundled `error`, `logger`, and
  `xsrf` middleware compactly.
- Mention `Http` separately and briefly as the raw-`Response` variant for
  non-JSON work such as uploads, downloads, blobs, and streams.

## Structure

1. A short description of `fetch-run`.
2. Installation.
3. A copy-pasteable `Api` quick start.
4. Middleware model and execution order.
5. A compact API reference.
6. Bundled middleware recipes.
7. A small `Http` callout.

## Non-goals

- No migration guide, release/tag/publish work, contributor section, or
  agent-specific documentation.
- No separate `AGENTS.md`.
- No behavior or public API changes.

## Acceptance criteria

- The README describes the v3 exports and behavior in `src/`.
- All examples are valid TypeScript and use supported APIs.
- The document makes `Api` the obvious default and does not over-document
  `Http`.
- Links point at the v3 branch or stable external documentation rather than
  legacy `master` source links.
