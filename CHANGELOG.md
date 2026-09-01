# Changelog

All notable changes to this project are documented in this file.

## [3.0.0]

### Breaking changes

- Removed the `Resource` helper, `Api.resource()`, and the `Resource`,
  `ResourceId`, `ResourceParams`, and `ResourceData` exports.
- Removed `Http.clone()` and `Http.onError()`.
- Removed the `errorMetro` middleware export.
- `Api.create()` and `Http.create()` now require a base URL.
- `search()` now accepts `URLSearchParams` rather than an object. The
  `query-string` dependency has been removed.

### Added

- `setBearer(null)` removes the `Authorization` header.
- Subscribers receive the originating request, response, and parsed JSON body.
- Subscribers are notified for error responses when the `error` middleware
  throws an `HTTPError`.
- Logger status lines include the downstream elapsed time, for example
  `GET /users (200) 42ms`.

### Changed

- Rewrote the README for the v3 API and migration path.
- Subscription notifications are asynchronous observers: they do not delay or
  alter request results.
- Package creation builds the runtime distribution automatically and excludes
  compiled test files from the published `dist` directory.
