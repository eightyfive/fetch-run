const json = next => async req => {
  const res = await next(req);

  if (res.headers.get('Content-Type') === 'application/json') {
    return res.json();
  }

  return res;
};

export default json;
