export class HTTPError extends Error {
  code: number;
  response: Response;
  request: Request;

  constructor(res: Response, req: Request) {
    super(res.statusText);

    this.code = res.status;
    this.name = 'HTTPError';
    this.request = req;
    this.response = res;
  }
}
