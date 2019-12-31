import HttpBase from './http-base';

export default class Http extends HttpBase {
  getKernel(req) {
    return next => req => fetch(req);
  }

  run(req) {
    return this.getStack().run(req);
  }
}
