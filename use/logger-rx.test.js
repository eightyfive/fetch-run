import Http from '../rx';
import logger from './logger-rx';

const spyGroup = jest
  .spyOn(global.console, 'groupCollapsed')
  .mockImplementation();
const spyLog = jest.spyOn(global.console, 'log').mockImplementation();

let api;

beforeEach(() => {
  jest.clearAllMocks();
  fetch.resetMocks();

  api = new Http('http://example.org', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  api.use(logger);
});

describe('logger', () => {
  it('logs req & res', done => {
    fetch.mockResponse('{"foo": "bar"}');

    api.get('api/resource').subscribe(() => {
      expect(spyGroup).toHaveBeenCalledWith('http://example.org/api/resource');
      expect(spyLog).toHaveBeenCalledTimes(3);

      done();
    });
  });
});
