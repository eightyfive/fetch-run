import { isJson } from '../utils';

export default function jsonMiddleware(next) {
  return async req => {
    const res = await next(req);

    if (isJson(res)) {
      return res.json();
    }

    return res;
  };
}
