import { normalize } from "normalizr";
//
import parseUrl from "../parse-url";

export default function createNormalize(mapSchema) {
  return next => async req => {
    const json = await next(req);
    const url = parseUrl(req.url);
    const prefix = mapSchema._prefix ? `/${mapSchema._prefix}/` : "/";
    const pathname = url.pathname.replace(prefix, "");

    const schema =
      typeof mapSchema === "function"
        ? mapSchema(req)
        : getSchema(pathname, mapSchema[req.method.toLowerCase()]);

    return schema ? normalize(json, schema) : json;
  };
}

function getSchema(pathname, schemas) {
  for (let pattern in schemas) {
    const re = new RegExp(pattern);

    if (re.test(pathname)) {
      return schemas[pattern];
    }
  }
}
