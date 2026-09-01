# Logger timer

## Goal

Include the elapsed downstream request time in each logger middleware status
line, using whole milliseconds.

## Behavior

- Capture a `Date.now()` timestamp immediately before calling
  `next(request)`.
- When the downstream layer returns its `Response`, calculate the difference
  from that timestamp.
- Append the elapsed value to the existing status line as ` <elapsed>ms`.
  For example: `GET /users (200) 42ms`.
- Keep the existing success/error console selection and verbose request and
  response body logging unchanged.
- Measure only the downstream request lifecycle; request/response cloning and
  verbose JSON formatting are deliberately excluded.

## Testing

- Add focused logger middleware tests with mocked clock values.
- Verify successful responses call `console.log` with the duration suffix.
- Verify error-status responses call `console.error` with the duration suffix.

## Non-goals

- No new logger options or public API.
- No sub-millisecond precision or alternative clock source.
- No logging for failures that throw before producing a `Response`, preserving
  the existing middleware behavior.
