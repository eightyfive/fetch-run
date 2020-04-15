import HTTPError from '../http-error';

const error = (next) => async (req) => {
  const res = await next(req);

  if (res.ok) {
    return res;
  }

  throw new HTTPError(res.status, res.statusText, req.clone(), res.clone());
};

export default error;
