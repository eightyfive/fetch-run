import 'jest-fetch-mock';
import qs from 'query-string';

import { Api } from './api';
import { Resource } from './resource';

type User = {
  id: number;
  name: string;
  email: string;
};

let api: Api;
let users: Resource<User>;

const id = 123;
const data = { name: 'John', email: 'john.smith@example.org' };
const params = { foo: 'bar' };

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
  fetchMock.mockResponse('{"foo": "bar"}');

  api = Api.create('http://example.org');

  users = api.resource<User>('users');
});

describe('Resource', () => {
  it('create', () => {
    // @ts-ignore
    const spy = jest.spyOn(users, 'request');

    users.create(data);

    expect(spy).toHaveBeenCalledWith('POST', 'users', data);
  });

  it('read', () => {
    // @ts-ignore
    const spy = jest.spyOn(users, 'request');

    users.read(id);

    expect(spy).toHaveBeenCalledWith('GET', `users/${id}`);
  });

  it('update', () => {
    // @ts-ignore
    const spy = jest.spyOn(users, 'request');

    users.update(id, data);

    expect(spy).toHaveBeenCalledWith('PUT', `users/${id}`, data);
  });

  it('delete', () => {
    // @ts-ignore
    const spy = jest.spyOn(users, 'request');

    users.delete(id);

    expect(spy).toHaveBeenCalledWith('DELETE', `users/${id}`);
  });

  it('list', () => {
    // @ts-ignore
    const spy = jest.spyOn(users, 'request');

    users.list();

    expect(spy).toHaveBeenCalledWith('GET', 'users');
  });

  it('list (search)', () => {
    // @ts-ignore
    const spy = jest.spyOn(users, 'request');

    users.list(params);

    expect(spy).toHaveBeenCalledWith('GET', `users?${qs.stringify(params)}`);
  });
});
