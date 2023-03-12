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
  userPost = api.resource<Post>('users/:userId/posts');
  userPostComment = api.resource<Comment>(
    'users/:userId/posts/:postId/comments',
  );
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

    userPost.create(data, { userId: 1 });

    expect(spy).toHaveBeenCalledWith('POST', 'users/1/posts', data, undefined);
  });

  it('read (deep)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    userPost.read(id, { userId: 1 });

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

    userPost.update(id, data, { userId: 1 });

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

    userPost.delete(id, { userId: 1 });

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

    userPost.list({ userId: 1 });

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

    userPost.search(params, { userId: 1 });

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

    userPostComment.read(id, { userId: 1, postId: 2 });

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users/1/posts/2/comments/${id}`,
      undefined,
      undefined,
    );
  });

  it('match', () => {
    expect(user.match('/users')).toEqual({});
    expect(user.match('/users/123')).toEqual({ id: '123' });

    expect(user.match('users')).toEqual(null);
    expect(user.match('/users/123/posts')).toEqual(null);
    expect(user.match('/users/bob/')).toEqual(null);
    expect(user.match('/venues/123')).toEqual(null);
    expect(user.match('/akdkheh')).toEqual(null);

    expect(userPost.match('/users/alice/posts')).toEqual({ userId: 'alice' });
    expect(userPost.match('/users/123/posts/456')).toEqual({
      userId: '123',
      id: '456',
    });
    expect(userPost.match('/users/posts/456')).toEqual(null);

    expect(userPostComment.match('/users/123/posts/title-ai/comments')).toEqual(
      {
        userId: '123',
        postId: 'title-ai',
      },
    );
    expect(userPostComment.match('/users/joe/posts/456/comments/789')).toEqual({
      userId: 'joe',
      postId: '456',
      id: '789',
    });
  });
});
