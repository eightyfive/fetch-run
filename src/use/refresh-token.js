let refreshToken;
let refreshing = false;

export function setRefreshToken(token) {
  refreshToken = token;
}

export default function createRefreshToken(key = 'refresh_token') {
  return next => async req => {
    let res;
    let _req = req.clone();

    try {
      res = await next(req);

      if (res[key]) {
        refreshToken = res[key];
      }
    } catch (err) {
      if (refreshToken && err.response && err.response.status === 401) {
        if (!refreshing) {
          refreshing = true;
          await this.refreshToken(refreshToken);
          res = await this.run(_req);
        } else {
          refreshToken = null;
          refreshing = false;
          throw err;
        }
      } else {
        throw err;
      }
    }

    return res;
  };
}
