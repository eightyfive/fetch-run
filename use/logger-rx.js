import { from } from 'rxjs';
import { tap, switchMap, mapTo } from 'rxjs/operators';

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

          if (res.status >= 300) {
            console.group(`Server Error (${res.status}): ${data.message}`);

            if (data.exception) {
              console.log(data.exception);
            }

            if (data.file) {
              console.log(`${data.file} (${data.line})`);
            }

            if (data.trace) {
              console.log(data.trace);
            }

            console.groupEnd();
          }
        }),
        mapTo(res),
      ),
    ),
  );
};

export default logger;
