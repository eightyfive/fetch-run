/* eslint-disable no-console */
import { tap } from 'rxjs/operators';

const logReq = tap(req => {
  console.groupCollapsed(req.url);
  console.log(req);
});

const logRes = tap(res => {
  console.log(res);
  console.groupEnd();

  if (res.status >= 300) {
    console.group(`Server Error (${res.status})`);

    const data = res.response;

    if (data) {
      console.error(data.message);

      if (data.exception) {
        console.log(data.exception);
      }

      if (data.file) {
        console.log(`${data.file} (${data.line})`);
      }

      console.log(data.trace);
    }

    console.groupEnd();
  }
});

const logger = next => req$ => next(req$.pipe(logReq)).pipe(logRes);

export default logger;
