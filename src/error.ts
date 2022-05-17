export class HTTPError extends Error {
  code: number;
  name: string;
  request: Request;
  response: Response;

  constructor(
    code: number,
    message: string,
    request: Request,
    response: Response,
  ) {
    super(message);

    this.code = code;
    this.name = 'HTTPError';
    this.request = request;
    this.response = response;
  }
}
