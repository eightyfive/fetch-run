import parseUrl from "../parse-url";

export default function createSetHeaders(headers) {
  return next => async req => {
    const url = parseUrl(req.url);
    const prefix = headers._prefix ? `/${headers._prefix}/` : "/";
    const pathname = url.pathname.replace(prefix, "");

    for (let pattern in headers) {
      let re;

      if (pattern.indexOf("_") === 0) {
        continue;
      }

      if (pattern === "*") {
        re = new RegExp("^.*$");
      } else {
        re = new RegExp(pattern);
      }

      if (re.test(pathname)) {
        for (let name in headers[pattern]) {
          req.headers.set(name, headers[pattern][name]);
        }
      }
    }

    return next(req);
  };
}
