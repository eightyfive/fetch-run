import { of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';

import HttpStack from './http-stack';

export default class HttpRx extends HttpStack {
  getKernel() {
    return req$ => req$.pipe(switchMap(req => fromFetch(req)));
  }

  run(req) {
    return this.getStack().run(of(req));
  }
}
