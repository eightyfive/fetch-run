import { filter, tap } from 'rxjs/operators';
import HttpError from '../http-error';

const error = next => req$ => {
  let _req;

  req$.subscribe(req => {
    _req = req;
  });

  return next(req$).pipe(
    filter(res => !res.ok),
    tap(({ status, statusText }) => {
      throw new HttpError(status, statusText, _req.clone(), res.clone());
    }),
  );
};

export default error;
