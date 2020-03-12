import { tap } from 'rxjs/operators';
import HttpError from '../http-error';

const error = next => req$ => {
  let _req;

  req$.subscribe(req => {
    _req = req.clone();
  });

  return next(req$).pipe(
    tap(res => {
      if (!res.ok) {
        throw new HttpError(res.status, res.statusText, _req, res.clone());
      }
    }),
  );
};

export default error;
