import { normalize } from 'normalizr';

export default function normalizrMiddleware(next) {
  return async req => {
    const json = await next(req);

    const { schema } = req._meta;

    return schema ? normalize(json, schema) : json;
  };
}
