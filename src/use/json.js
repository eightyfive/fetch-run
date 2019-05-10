import { isJson } from '../utils';

export default function jsonResponse(next) {
  return async req => {
    const res = await next(req);

    if (isJson(res)) {
      return await res.json();
    }

    return res;
  };
}
