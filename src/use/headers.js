import parseUrl from '../parse-url';

export default function createSetHeaders(headers) {
  return next => async req => {
    const url = parseUrl(req.url);
    const prefix = headers._prefix ? `/${headers._prefix}/` : '/';
    const pathname = url.pathname.replace(prefix, '');

    for (let method in headers) {
      if (method.indexOf('_') === 0) {
        continue;
      }

      if (method === '*') {
        setHeaders(req, headers[method]);
      } else if (method === req.method.toLowerCase()) {
        for (let pattern in headers[method]) {
          const re = new RegExp(pattern);

          if (re.test(pathname)) {
            setHeaders(req, headers[method][pattern]);
          }
        }
      }
    }

    return next(req);
  };
}

function setHeaders(req, headers) {
  for (let key in headers) {
    const val = headers[key];

    if (val === false) {
      req.headers.delete(key);
    } else {
      req.headers.set(key, val);
    }
  }
}
