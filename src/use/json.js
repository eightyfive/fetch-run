if (res.status >= 200 && res.status < 300) {
  return res.json();
}

export default function jsonResponse(next) {
  return async req => {
    const res = await next(req);

    if (res.status >= 200 && res.status < 300) {
      return await res.json();
    }

    return res;
  };
}
