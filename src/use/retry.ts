import { HTTPError } from '../http-error';
import { Middleware } from '../types';

export interface RetryOptions {
  /** Additional attempts. Defaults to 3; 0 disables retries. */
  retry?: number;
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

export function createRetry({ retry = 3 }: RetryOptions = {}): Middleware {
  if (!Number.isSafeInteger(retry) || retry < 0) {
    throw new RangeError('retry must be a non-negative safe integer.');
  }

  return (next) => async (request) => {
    if (request.signal?.aborted) {
      throw abortReason(request.signal);
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) || retry === 0) {
      return next(request);
    }

    for (let failureCount = 0; ; failureCount += 1) {
      if (request.signal?.aborted) {
        throw abortReason(request.signal);
      }

      let response: Response | undefined;
      let failure: unknown;
      // Isolate each attempt from downstream middleware changes.
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
        !isAbort(failure) && isTransient(failure) && failureCount < retry;

      if (!shouldRetry) {
        // Preserve downstream behavior: only the error middleware throws HTTP errors.
        if (response) {
          return response;
        }
        throw failure;
      }

      const delay = Math.min(1000 * 2 ** failureCount, 30000);

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
