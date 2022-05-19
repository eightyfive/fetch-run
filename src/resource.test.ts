import { Http } from './http';
import 'jest-fetch-mock';
import { Resource } from './resource';

type User = {
  id: number;
  name: string;
  email: string;
};

let api: Http;
let users: Resource<User>;

const id = 123;
const data = { name: 'John', email: 'john.smith@example.org' };
const params = { foo: 'bar' };

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();

  api = new Http('http://example.org');
  users = api.resource<User>('users');
});

describe('Resource', () => {
  it('create', () => {
    const spy = jest.spyOn(api, 'post');

    users.create(data);

    expect(spy).toHaveBeenCalledWith('users', data);
  });

  it('read', () => {
    const spy = jest.spyOn(api, 'get');

    users.read(id);

    expect(spy).toHaveBeenCalledWith(`users/${id}`);
  });

  it('update', () => {
    const spy = jest.spyOn(api, 'put');

    users.update(id, data);

    expect(spy).toHaveBeenCalledWith(`users/${id}`, data);
  });

  it('delete', () => {
    const spy = jest.spyOn(api, 'delete');

    users.delete(id);

    expect(spy).toHaveBeenCalledWith(`users/${id}`);
  });

  it('list', () => {
    const spy = jest.spyOn(api, 'get');

    users.list();

    expect(spy).toHaveBeenCalledWith('users');
  });

  it('search', () => {
    const spy = jest.spyOn(api, 'search');

    users.list(params);

    expect(spy).toHaveBeenCalledWith('users', params);
  });
});
