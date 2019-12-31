import { of } from 'rxjs';

import HttpBase from './http-base';

export default class HttpRx extends HttpBase {
  getKernel(req) {
    // TODO
  }

  run(req) {
    return this.getStack().run(of(req));
  }
}
