
export default function createSetAccessToken(key = "access_token") {
  return next => async req => {
    const token = this.getAccessToken();

    if (token) {
      // Use `set` instead of `append` to always use most recent token
      req.headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await next(req);

    if (res[key]) {
      this.setAccessToken(res[key]);
    }

    return res;
  };
}
