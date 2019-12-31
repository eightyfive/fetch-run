import { filter, tap } from 'rxjs/operators';
import HttpError from '../http-error';

const error = next => req$ =>
  next(req$).pipe(
    filter(res => !res.ok),
    tap(res => {
      const code = res.status;
      const message = res.statusText;

      throw new HttpError(code, message, res.clone());
    }),
  );

export default error;
