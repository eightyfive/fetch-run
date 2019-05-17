export default class HttpError extends Error {
  constructor(res, data) {
    super(res.statusText || `HTTP Error ${res.status}`);

    this.response = res;
    this.data = data;
  }
}
