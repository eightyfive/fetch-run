import { jest } from '@jest/globals';
import { Http } from '../http';
import { Layer } from '../types';
import 'jest-fetch-mock';
import { HTTPError } from '../http-error';
import { error } from './error';
import { createRetry, retry } from './index';

const url = 'https://api.example.test/users';
const realSetImmediate = setImmediate;
const flush = () => new Promise<void>((resolve) => realSetImmediate(resolve));

describe('retry middleware', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['performance', 'setImmediate'] });
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('makes three additional attempts after 1s, 2s, and 4s, returning the final response', async () => {
    const responses = [503, 503, 503, 503].map(
      (status) => new Response('unavailable', { status }),
    );
    let attempt = 0;
    const next = jest.fn(async () => responses[attempt++]);
    const result = retry(next)(new Request(url));
    await flush();

    for (const [index, delay] of [1000, 2000, 4000].entries()) {
      jest.advanceTimersByTime(delay - 1);
      await flush();
      expect(next).toHaveBeenCalledTimes(index + 1);
      jest.advanceTimersByTime(1);
      await flush();
      expect(next).toHaveBeenCalledTimes(index + 2);
    }

    expect(await result).toBe(responses[3]);
    expect(await responses[3].text()).toBe('unavailable');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('caps exponential delays at 30 seconds and stops when an attempt succeeds', async () => {
    const times: number[] = [];
    const started = Date.now();
    const next = jest.fn(async () => {
      times.push(Date.now() - started);
      return new Response(null, { status: times.length === 8 ? 200 : 503 });
    });
    const result = createRetry({ retry: 10 })(next)(new Request(url));
    await flush();
    for (const delay of [1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
      jest.advanceTimersByTime(delay);
      await flush();
    }

    expect((await result).status).toBe(200);
    expect(times).toEqual([0, 1000, 3000, 7000, 15000, 31000, 61000, 91000]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([false, 0])('disables retries with retry: %s', async (setting) => {
    const next = jest.fn(async () => new Response(null, { status: 503 }));
    expect(
      (await createRetry({ retry: setting })(next)(new Request(url))).status,
    ).toBe(503);
    expect(next).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([400, 401, 403, 404, 422, 501])(
    'does not retry HTTP %s by default',
    async (status) => {
      const next = jest.fn(async () => new Response(null, { status }));
      expect((await retry(next)(new Request(url))).status).toBe(status);
      expect(next).toHaveBeenCalledTimes(1);
    },
  );

  it.each([408, 429, 500, 502, 503, 504])(
    'recovers from HTTP %s with a configured delay',
    async (status) => {
      const next = jest
        .fn<Layer>()
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(new Response('ok'));
      const result = createRetry({ retry: 1, retryDelay: 25 })(next)(
        new Request(url),
      );
      await flush();
      jest.advanceTimersByTime(24);
      await flush();
      expect(next).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1);
      expect(await (await result).text()).toBe('ok');
      expect(next).toHaveBeenCalledTimes(2);
    },
  );

  it('retries network failures and preserves the last rejection', async () => {
    const failure = new TypeError('Failed to fetch');
    const next = jest.fn<Layer>().mockRejectedValue(failure);
    const result = createRetry({ retry: 1, retryDelay: 10 })(next)(
      new Request(url),
    );
    const assertion = expect(result).rejects.toBe(failure);
    await flush();
    jest.advanceTimersByTime(10);
    await assertion;
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('does not retry unrelated middleware errors or abort errors, even with retry: true', async () => {
    for (const failure of [
      new Error('middleware failed'),
      Object.assign(new Error('cancelled'), { name: 'AbortError' }),
    ]) {
      const next = jest.fn<Layer>().mockRejectedValue(failure);
      await expect(
        createRetry({ retry: true })(next)(new Request(url)),
      ).rejects.toBe(failure);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  it('supports a custom predicate and delay with zero-based counts and HTTP errors', async () => {
    const counts: number[] = [];
    const delays: number[] = [];
    const next = jest.fn(async () => new Response(null, { status: 404 }));
    const result = createRetry({
      retry: (count, failure) => {
        expect(failure).toBeInstanceOf(HTTPError);
        expect((failure as HTTPError).code).toBe(404);
        counts.push(count);
        return count < 2;
      },
      retryDelay: (count, failure) => {
        expect((failure as HTTPError).code).toBe(404);
        delays.push(count);
        return (count + 1) * 10;
      },
    })(next)(new Request(url));
    await flush();
    jest.advanceTimersByTime(10);
    await flush();
    jest.advanceTimersByTime(20);
    expect((await result).status).toBe(404);
    expect(counts).toEqual([0, 1, 2]);
    expect(delays).toEqual([0, 1]);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'does not repeat %s requests by default',
    async (method) => {
      const next = jest.fn(async () => new Response(null, { status: 503 }));
      await retry(next)(new Request(url, { method }));
      expect(next).toHaveBeenCalledTimes(1);
    },
  );

  it('replays the complete body and headers when writes are explicitly enabled', async () => {
    const bodies: string[] = [];
    const next = jest.fn(async (request: Request) => {
      bodies.push(await request.text());
      expect(request.headers.get('Idempotency-Key')).toBe('create-user-1');
      return new Response(null, { status: bodies.length === 1 ? 503 : 200 });
    });
    const result = createRetry({ methods: ['post'], retryDelay: 10 })(next)(
      new Request(url, {
        method: 'POST',
        body: '{"name":"Sam"}',
        headers: { 'Idempotency-Key': 'create-user-1' },
      }),
    );
    await flush();
    jest.advanceTimersByTime(10);
    expect((await result).status).toBe(200);
    expect(bodies).toEqual(['{"name":"Sam"}', '{"name":"Sam"}']);
  });

  it.each([true, false])(
    'works with error middleware registered first: %s',
    async (errorFirst) => {
      const http = Http.create('https://api.example.test');
      const retryMiddleware = createRetry({ retry: 1, retryDelay: 10 });
      http.use(errorFirst ? error : retryMiddleware);
      http.use(errorFirst ? retryMiddleware : error);
      fetchMock.mockResponses(
        ['busy', { status: 503 }],
        ['still busy', { status: 503 }],
      );
      const result = http.get('users');
      const assertion = expect(result).rejects.toMatchObject({ code: 503 });
      await flush();
      jest.advanceTimersByTime(10);
      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const failure = await result.catch((caught: HTTPError) => caught);
      expect(failure).toBeInstanceOf(HTTPError);
      expect(await (failure as HTTPError).response.text()).toBe('still busy');
    },
  );

  it('cancels backoff immediately without sending another request', async () => {
    const controller = new AbortController();
    const next = jest.fn(async () => new Response(null, { status: 503 }));
    const result = retry(next)(new Request(url, { signal: controller.signal }));
    const assertion = expect(result).rejects.toMatchObject({
      name: 'AbortError',
    });
    await flush();
    controller.abort();
    await assertion;
    expect(jest.getTimerCount()).toBe(0);
    jest.advanceTimersByTime(60000);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not send an already aborted request', async () => {
    const controller = new AbortController();
    controller.abort();
    const next = jest.fn<Layer>();
    await expect(
      retry(next)(new Request(url, { signal: controller.signal })),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps retry budgets independent for concurrent requests', async () => {
    const next = jest.fn(async () => new Response(null, { status: 503 }));
    const run = createRetry({ retry: 1, retryDelay: 10 })(next);
    const results = Promise.all([run(new Request(url)), run(new Request(url))]);
    await flush();
    jest.advanceTimersByTime(10);
    expect((await results).map((response) => response.status)).toEqual([
      503, 503,
    ]);
    expect(next).toHaveBeenCalledTimes(4);
  });

  it.each([-1, 1.5, Infinity, NaN])(
    'rejects an invalid retry budget: %s',
    (count) => {
      expect(() => createRetry({ retry: count })).toThrow(RangeError);
    },
  );

  it.each([-1, Infinity, NaN, 2147483648])(
    'rejects an invalid delay: %s',
    (delay) => {
      expect(() => createRetry({ retryDelay: delay })).toThrow(RangeError);
    },
  );
});
