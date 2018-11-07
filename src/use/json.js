const regExp = /([\/+])json$/;

export default function jsonResponse(next) {
  return async req => {
    const res = await next(req);
    const contentType = res.headers.get("Content-Type");
    const isJson = regExp.test(contentType);

    if (res.status >= 200 && res.status < 300 && isJson) {
      return await res.json();
    }

    return res;
  };
}
