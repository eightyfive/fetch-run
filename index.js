import HttpStack from './http-stack';

export default class Http extends HttpStack {
  getKernel() {
    return req => fetch(req);
  }

  run(req) {
    return this.getStack().run(req);
  }
}
