import HttpError from '../http-error';

const error = next => async req => {
  const res = await next(req);

  if (res.ok) {
    return res;
  }

  throw new HttpError(res.status, res.statusText, res.clone());
};

export default error;
