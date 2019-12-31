import HttpBase from './http-base';

export default class Http extends HttpBase {
  getKernel() {
    return req => fetch(req);
  }

  run(req) {
    return this.getStack().run(req);
  }
}
