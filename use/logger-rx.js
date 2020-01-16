/* eslint-disable no-console */
import { from } from 'rxjs';
import { tap, filter, switchMap, mapTo } from 'rxjs/operators';

const logger = next => req$ => {
  let _req;

  req$.subscribe(req => {
    _req = req;
  });

  return next(req$).pipe(
    switchMap(res =>
      from(res.clone().json()).pipe(
        tap(data => {
          console.groupCollapsed(_req.url);
          console.log(_req);
          console.log(res);
          console.log(data);
          console.groupEnd();
        }),
        filter(data => res.status >= 300),
        tap(data => {
          console.group(`Server Error (${res.status})`);
          console.error(data.message);

          if (data.exception) {
            console.log(data.exception);
          }

          if (data.file) {
            console.log(`${data.file} (${data.line})`);
          }

          console.log(data.trace);
          console.groupEnd();
        }),
        mapTo(res),
      ),
    ),
  );
};

export default logger;
