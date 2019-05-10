import { isJson } from '../utils';

export default function logger(next) {
  return async req => {
    const res = await next(req);

    const data = isJson(res) ? await res.clone().json() : null;

    console.groupCollapsed(req.url);
    console.log(req);
    console.log(res);

    if (data) {
      console.log(data);
    }

    console.groupEnd();

    if (res.status >= 500) {
      console.group(`Internal Server Error (${res.status})`);

      if (data) {
        console.error(data.message);

        if (data.exception) {
          console.log(data.exception);
        }

        if (data.file) {
          console.log(`${data.file} (${data.line})`);
        }

        console.log(data.trace);
        console.groupEnd();
      }
    }

    return res;
  };
}
