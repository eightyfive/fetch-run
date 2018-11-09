
export default function createRefreshToken(key = "refresh_token") {
  return next => async req => {
    let res;
    let _req = req.clone();

    try {
      res = await next(req);

      if (res[key]) {
        this.setRefreshToken(res[key]);
      }
    } catch (err) {
      const token = this.getRefreshToken();

      if (err.response && err.response.status === 401 && token) {
        if (!this.refreshing) {
          this.refreshing = true;
          await this.refreshToken(token);
          res = await this.run(_req);
        } else {
          this.refreshing = false;
          throw err;
        }
      } else {
        throw err;
      }
    }

    return res;
  };
}
