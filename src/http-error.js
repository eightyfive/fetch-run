export default class HttpError extends Error {
  constructor(res, data) {
    super(res.statusText);

    this.response = res;
    this.data = data;
  }
}
