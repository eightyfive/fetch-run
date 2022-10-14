import 'jest-fetch-mock';
import qs from 'query-string';

import { Api } from './api';
import { Resource } from './resource';

type User = {
  id: number;
  name: string;
};

type Post = {
  id: number;
  title: string;
};

type Comment = {
  id: number;
  content: string;
};

let api: Api;
let user: Resource<User>;
let userPost: Resource<Post>;
let userPostComment: Resource<Comment>;

const id = 123;
const data = { name: 'John', email: 'john.smith@example.org' };
const params = { foo: 'bar' };

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
  fetchMock.mockResponse('{"foo": "bar"}');

  api = Api.create('http://example.org');

  user = api.resource<User>('users');
  userPost = user.resource<Post>('posts');
  userPostComment = userPost.resource<Post>('comments');
});

describe('Resource', () => {
  it('create', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    user.create(data);

    expect(spy).toHaveBeenCalledWith('POST', 'users', data, undefined);
  });

  it('read', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    user.read(id);

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users/${id}`,
      undefined,
      undefined,
    );
  });

  it('update', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    user.update(id, data);

    expect(spy).toHaveBeenCalledWith('PUT', `users/${id}`, data, undefined);
  });

  it('delete', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    user.delete(id);

    expect(spy).toHaveBeenCalledWith(
      'DELETE',
      `users/${id}`,
      undefined,
      undefined,
    );
  });

  it('list', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    user.list();

    expect(spy).toHaveBeenCalledWith('GET', 'users', undefined, undefined);
  });

  it('search', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    user.search(params);

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users?${qs.stringify(params)}`,
      undefined,
      undefined,
    );
  });

  it('create (deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPost.create(data, 1);

    expect(spy).toHaveBeenCalledWith('POST', 'users/1/posts', data, undefined);
  });

  it('read (deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPost.read(id, 1);

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users/1/posts/${id}`,
      undefined,
      undefined,
    );
  });

  it('update (deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPost.update(id, data, 1);

    expect(spy).toHaveBeenCalledWith(
      'PUT',
      `users/1/posts/${id}`,
      data,
      undefined,
    );
  });

  it('delete (deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPost.delete(id, 1);

    expect(spy).toHaveBeenCalledWith(
      'DELETE',
      `users/1/posts/${id}`,
      undefined,
      undefined,
    );
  });

  it('list (deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPost.list(1);

    expect(spy).toHaveBeenCalledWith(
      'GET',
      'users/1/posts',
      undefined,
      undefined,
    );
  });

  it('search (deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPost.search(params, 1);

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users/1/posts?${qs.stringify(params)}`,
      undefined,
      undefined,
    );
  });

  it('read (super deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPostComment.read(id, 2, 1);

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users/1/posts/2/comments/${id}`,
      undefined,
      undefined,
    );
  });

  it('build query key', () => {
    const USER_ID = 1;
    const POST_ID = 2;
    const COMMENT_ID = 3;

    expect(user.getQueryKey()).toEqual(['users']);
    expect(user.getQueryKey([], USER_ID)).toEqual(['users', USER_ID]);

    expect(userPost.getQueryKey()).toEqual(['users', undefined, 'posts']);
    expect(userPost.getQueryKey([USER_ID])).toEqual([
      'users',
      USER_ID,
      'posts',
    ]);
    expect(userPost.getQueryKey([USER_ID], POST_ID)).toEqual([
      'users',
      USER_ID,
      'posts',
      POST_ID,
    ]);

    expect(userPostComment.getQueryKey()).toEqual([
      'users',
      undefined,
      'posts',
      undefined,
      'comments',
    ]);
    expect(userPostComment.getQueryKey([USER_ID])).toEqual([
      'users',
      USER_ID,
      'posts',
      undefined,
      'comments',
    ]);
    expect(userPostComment.getQueryKey([POST_ID, USER_ID])).toEqual([
      'users',
      USER_ID,
      'posts',
      POST_ID,
      'comments',
    ]);
    expect(userPostComment.getQueryKey([POST_ID, USER_ID], COMMENT_ID)).toEqual(
      ['users', USER_ID, 'posts', POST_ID, 'comments', COMMENT_ID],
    );
  });
});
