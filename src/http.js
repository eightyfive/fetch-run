import HttpBase from 'http-base';

export default class Http extends HttpBase {
  getKernel(req) {
    return fetch(req);
  }
}
