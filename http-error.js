export default class HttpError extends Error {
  constructor(code, message, request, response) {
    super(message);

    this.code = code;
    this.name = 'HTTPError';
    this.request = request;
    this.response = response;
  }
}
