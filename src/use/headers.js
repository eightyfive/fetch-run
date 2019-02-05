import parseUrl from '../parse-url';

export default function createSetHeaders(config) {
  return next => async req => {
    const url = parseUrl(req.url);
    const prefix = config._prefix ? `/${config._prefix}/` : '/';
    const pathname = url.pathname.replace(prefix, '');
    const reqMethod = req.method.toLowerCase();

    for (let method in config) {
      if (method.indexOf('_') === 0) continue;
      if (method !== reqMethod) continue;

      for (let pattern in config[method]) {
        const re = new RegExp(pattern);

        if (re.test(pathname)) {
          setHeaders(req, config[method][pattern]);
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
