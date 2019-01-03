export class HttpError extends Error {}

const _mapError = json => ({ data: json });

export default function createErrorHandler(mapError = _mapError) {
  return next => async req => {
    const res = await next(req);

    if (res.status < 200 || res.status >= 300) {
      const err = new HttpError(res.statusText);

      err.response = res;

      Object.assign(err, mapError(await res.json(), res.status));

      throw err;
    }

    return res;
  };
}
