import { isJson } from '../utils';
import HttpError from '../http-error';

export default function errorMiddleware(next) {
  return async req => {
    const res = await next(req);

    if (res.status < 200 || res.status >= 300) {
      const data = isJson(res) ? await res.clone().json() : null;

      throw new HttpError(res, data);
    }

    return res;
  };
}