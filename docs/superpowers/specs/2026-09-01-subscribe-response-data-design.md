# Subscribe response and data design

## Goal

Change `Http.subscribe()` from a parsed-response callback to a non-blocking
response-observation callback:

```ts
subscribe((request, response, data) => {
  // observe the original response and its parsed JSON payload
});
```

## Contract

- A listener receives the originating `Request`, the original `Response`, and
  the JSON payload parsed from a single clone of that response.
- `data` is `Json | null`. `null` covers an empty body and JSON that cannot be
  parsed.
- All listeners for an event receive the same `Response` instance and the same
  parsed `data` value.
- The `Response` body belongs to the request caller. A listener that needs to
  consume the raw body must call `response.clone()` itself before consuming the
  clone.
- An HTTP response that an error middleware turns into `HTTPError` is emitted
  with `error.response`, then the error is rethrown. Transport failures with no
  response continue not to emit a response event.

## Timing

`emit()` remains asynchronous and is deliberately not awaited by `request()`.
The request is sent in either design; the distinction is that `Http.get()`
continues to resolve as soon as the fetch response is available, rather than
waiting for JSON parsing and notification callbacks. This preserves the raw
`Response` streaming path and keeps observation work off the request's critical
path.

The alternative—awaiting the observer work—would be appropriate only if
listeners were mandatory lifecycle participants, such as a transactional state
update or an audit action that must finish before callers proceed. It is not
the intended role of `subscribe()` here.

## Implementation and tests

- Replace `ResponseParsed` with a JSON-payload parser and update `Listener` to
  accept `(Request, Response, Json | null)`.
- Keep one internal `response.clone()` solely to parse the shared payload.
- Update the README callback example and semantics.
- Add tests that verify listeners receive the original response and parsed
  data, and that the original body remains consumable after notification.
