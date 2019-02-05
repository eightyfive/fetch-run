let accessToken;

export function setAccessToken(token) {
  accessToken = token;
}

export default function createSetAccessToken(key = 'access_token') {
  return next => async req => {
    if (accessToken) {
      // Use `set` instead of `append` to always use most recent token
      req.headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const res = await next(req);

    if (res[key]) {
      accessToken = res[key];
    }

    return res;
  };
}
