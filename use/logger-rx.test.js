import Http from '../rx';
import logger from './logger-rx';

const spyGroup = jest
  .spyOn(global.console, 'groupCollapsed')
  .mockImplementation();
const spyLog = jest.spyOn(global.console, 'log').mockImplementation();

let api;

beforeEach(() => {
  api = new Http();
  api.use(logger);
});

describe('logger', () => {
  it('logs req & res', done => {
    api.get('http://example.org').subscribe(() => {
      expect(spyGroup).toHaveBeenCalledWith('http://example.org/');
      expect(spyLog).toHaveBeenCalledTimes(2);
      done();
    });
  });
});
