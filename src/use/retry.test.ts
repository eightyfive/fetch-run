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

  it('makes three additional attempts after 1s, 2s, and 4s, rejecting with the final HTTPError', async () => {
    const responses = [503, 503, 503, 503].map(
      (status) => new Response('unavailable', { status }),
    );
    let attempt = 0;
    const next = jest.fn(async () => responses[attempt++]);
    const result = retry(error(next))(new Request(url));
    const assertion = expect(result).rejects.toMatchObject({ code: 503 });
    await flush();

    for (const [index, delay] of [1000, 2000, 4000].entries()) {
      jest.advanceTimersByTime(delay - 1);
      await flush();
      expect(next).toHaveBeenCalledTimes(index + 1);
      jest.advanceTimersByTime(1);
      await flush();
      expect(next).toHaveBeenCalledTimes(index + 2);
    }

    await assertion;
    const failure = await result.catch((caught: HTTPError) => caught);
    expect(failure).toBeInstanceOf(HTTPError);
    expect(await (failure as HTTPError).response.text()).toBe('unavailable');
    expect(jest.getTimerCount()).toBe(0);
  });

  it('caps exponential delays at 30 seconds and stops when an attempt succeeds', async () => {
    const times: number[] = [];
    const started = Date.now();
    const next = jest.fn(async () => {
      times.push(Date.now() - started);
      return new Response(null, { status: times.length === 8 ? 200 : 503 });
    });
    const result = createRetry({ retry: 10 })(error(next))(new Request(url));
    await flush();
    for (const delay of [1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
      jest.advanceTimersByTime(delay);
      await flush();
    }

    expect((await result).status).toBe(200);
    expect(times).toEqual([0, 1000, 3000, 7000, 15000, 31000, 61000, 91000]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('disables retries with retry: 0', async () => {
    const next = jest.fn(async () => new Response(null, { status: 503 }));
    await expect(
      createRetry({ retry: 0 })(error(next))(new Request(url)),
    ).rejects.toMatchObject({ code: 503 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([400, 401, 403, 404, 422, 501])(
    'does not retry HTTP %s by default',
    async (status) => {
      const next = jest.fn(async () => new Response(null, { status }));
      await expect(retry(error(next))(new Request(url))).rejects.toMatchObject({
        code: status,
      });
      expect(next).toHaveBeenCalledTimes(1);
    },
  );

  it.each([408, 429, 500, 502, 503, 504])(
    'recovers from HTTP %s after one second',
    async (status) => {
      const next = jest
        .fn<Layer>()
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(new Response('ok'));
      const result = createRetry({ retry: 1 })(error(next))(new Request(url));
      await flush();
      jest.advanceTimersByTime(999);
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
    const result = createRetry({ retry: 1 })(error(next))(new Request(url));
    const assertion = expect(result).rejects.toBe(failure);
    await flush();
    jest.advanceTimersByTime(1000);
    await assertion;
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('does not retry unrelated middleware errors or abort errors', async () => {
    for (const failure of [
      new Error('middleware failed'),
      Object.assign(new Error('cancelled'), { name: 'AbortError' }),
    ]) {
      const next = jest.fn<Layer>().mockRejectedValue(failure);
      await expect(retry(error(next))(new Request(url))).rejects.toBe(failure);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'never repeats %s requests after an HTTP failure',
    async (method) => {
      const next = jest.fn(async () => new Response(null, { status: 503 }));
      await expect(
        retry(error(next))(new Request(url, { method })),
      ).rejects.toMatchObject({ code: 503 });
      expect(next).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'never repeats %s requests after a network failure',
    async (method) => {
      const failure = new TypeError('Failed to fetch');
      const next = jest.fn<Layer>().mockRejectedValue(failure);
      await expect(
        retry(error(next))(new Request(url, { method })),
      ).rejects.toBe(failure);
      expect(next).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    },
  );

  it.each(['HEAD', 'OPTIONS'])(
    'retries transient failures on %s requests',
    async (method) => {
      const next = jest
        .fn<Layer>()
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }));
      const result = retry(error(next))(new Request(url, { method }));
      await flush();
      jest.advanceTimersByTime(1000);
      expect((await result).status).toBe(200);
      expect(next).toHaveBeenCalledTimes(2);
    },
  );

  it('retries HTTPError when error is registered before retry', async () => {
    const http = Http.create('https://api.example.test');
    http.use(error);
    http.use(createRetry({ retry: 1 }));
    fetchMock.mockResponses(
      ['busy', { status: 503 }],
      ['still busy', { status: 503 }],
    );
    const result = http.get('users');
    const assertion = expect(result).rejects.toMatchObject({ code: 503 });
    await flush();
    jest.advanceTimersByTime(1000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const failure = await result.catch((caught: HTTPError) => caught);
    expect(failure).toBeInstanceOf(HTTPError);
    expect(await (failure as HTTPError).response.text()).toBe('still busy');
  });

  it('passes raw HTTP responses through without retrying or creating HTTPError', async () => {
    const response = new Response('busy', { status: 503 });
    const next = jest.fn<Layer>().mockResolvedValue(response);
    expect(await retry(next)(new Request(url))).toBe(response);
    expect(await response.text()).toBe('busy');
    expect(next).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not retry HTTP failures when error is registered outside retry', async () => {
    const http = Http.create('https://api.example.test');
    http.use(retry);
    http.use(error);
    fetchMock.mockResponse('busy', { status: 503 });
    await expect(http.get('users')).rejects.toMatchObject({ code: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cancels backoff immediately without sending another request', async () => {
    const controller = new AbortController();
    const next = jest.fn(async () => new Response(null, { status: 503 }));
    const result = retry(error(next))(
      new Request(url, { signal: controller.signal }),
    );
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
      retry(error(next))(new Request(url, { signal: controller.signal })),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps retry budgets independent for concurrent requests', async () => {
    const next = jest.fn(async () => new Response(null, { status: 503 }));
    const run = createRetry({ retry: 1 })(error(next));
    const results = Promise.allSettled([
      run(new Request(url)),
      run(new Request(url)),
    ]);
    await flush();
    jest.advanceTimersByTime(1000);
    expect(await results).toMatchObject([
      { status: 'rejected', reason: { code: 503 } },
      { status: 'rejected', reason: { code: 503 } },
    ]);
    expect(next).toHaveBeenCalledTimes(4);
  });

  it.each([
    -1,
    1.5,
    Infinity,
    NaN,
    Number.MAX_SAFE_INTEGER + 1,
    true,
    false,
    '3',
    () => true,
  ])('rejects an invalid retry budget: %s', (count) => {
    expect(() => createRetry({ retry: count as unknown as number })).toThrow(
      RangeError,
    );
  });
});
