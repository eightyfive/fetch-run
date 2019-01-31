import HttpError from '../http-error';

export default function createErrorHandler() {
  return next => async req => {
    const res = await next(req);

    if (res.status < 200 || res.status >= 300) {
      throw new HttpError(res);
    }

    return res;
  };
}
