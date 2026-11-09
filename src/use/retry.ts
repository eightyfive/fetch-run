import { HTTPError } from '../http-error';
import { Middleware } from '../types';

export interface RetryOptions {
  /** Additional attempts, or a predicate whose failureCount starts at zero. */
  retry?:
    | boolean
    | number
    | ((failureCount: number, error: unknown) => boolean);
  /** Milliseconds before a retry. Defaults to exponential backoff capped at 30s. */
  retryDelay?: number | ((failureCount: number, error: unknown) => number);
  /** Methods eligible for retries. Writes must be explicitly opted in. */
  methods?: readonly string[];
}

function isTransient(error: unknown) {
  if (error instanceof HTTPError) {
    return [408, 429, 500, 502, 503, 504].includes(error.code);
  }

  return error instanceof TypeError;
}

function isAbort(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function abortReason(signal: AbortSignal) {
  return (
    signal.reason ??
    Object.assign(new Error('The request was aborted.'), {
      name: 'AbortError',
    })
  );
}

function validateDelay(delay: number) {
  if (!Number.isFinite(delay) || delay < 0 || delay > 2147483647) {
    throw new RangeError(
      'retryDelay must be between 0 and 2147483647 milliseconds.',
    );
  }
}

function wait(delay: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      if (signal) reject(abortReason(signal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function createRetry({
  retry = 3,
  retryDelay = (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
  methods = ['GET', 'HEAD', 'OPTIONS'],
}: RetryOptions = {}): Middleware {
  if (typeof retry === 'number' && (!Number.isInteger(retry) || retry < 0)) {
    throw new RangeError('retry must be a non-negative integer.');
  }
  if (typeof retryDelay === 'number') {
    validateDelay(retryDelay);
  }

  const allowedMethods = new Set(methods.map((method) => method.toUpperCase()));

  return (next) => async (request) => {
    if (request.signal?.aborted) {
      throw abortReason(request.signal);
    }
    if (!allowedMethods.has(request.method) || retry === false || retry === 0) {
      return next(request);
    }

    for (let failureCount = 0; ; failureCount += 1) {
      if (request.signal?.aborted) {
        throw abortReason(request.signal);
      }

      let response: Response | undefined;
      let failure: unknown;
      // Keep the original body available for every attempt, including uploads.
      const attempt = request.clone();
      try {
        response = await next(attempt);
        if (response.ok) {
          return response;
        }
        failure = new HTTPError(response, request);
      } catch (error) {
        failure = error;
      }

      if (request.signal?.aborted) {
        throw abortReason(request.signal);
      }
      const shouldRetry =
        !isAbort(failure) &&
        (typeof retry === 'function'
          ? retry(failureCount, failure)
          : isTransient(failure) && (retry === true || failureCount < retry));

      if (!shouldRetry) {
        // Preserve downstream behavior: only the error middleware throws HTTP errors.
        if (response) {
          return response;
        }
        throw failure;
      }

      const delay =
        typeof retryDelay === 'function'
          ? retryDelay(failureCount, failure)
          : retryDelay;
      validateDelay(delay);

      // Release discarded fetch responses without waiting on a cloned stream's tee.
      const discarded =
        response ??
        (failure instanceof HTTPError ? failure.response : undefined);
      if (discarded?.body && !discarded.body.locked) {
        void discarded.body.cancel?.().catch(() => undefined);
      }
      await wait(delay, request.signal);
    }
  };
}

export const retry: Middleware = createRetry();
