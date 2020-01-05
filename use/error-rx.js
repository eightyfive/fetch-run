import { filter, tap } from 'rxjs/operators';
import HttpError from '../http-error';

const error = next => req$ => {
  let _req;

  req$.subscribe(req => {
    _req = req;
  });

  return next(req$).pipe(
    filter(res => !res.ok),
    tap(res => {
      throw new HttpError(
        res.status,
        res.statusText,
        _req.clone(),
        res.clone(),
      );
    }),
  );
};

export default error;
