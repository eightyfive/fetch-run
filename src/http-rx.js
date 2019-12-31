import { of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs/operators';

import HttpBase from './http-base';

export default class HttpRx extends HttpBase {
  getKernel(req$) {
    return next => req$ => req$.pipe(switchMap(req => fromFetch(req)));
  }

  run(req) {
    return this.getStack().run(of(req));
  }
}
