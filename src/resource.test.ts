import 'jest-fetch-mock';

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
let user: Resource<User, User, 'users'>;
let userPost: Resource<Post, Post, 'users/:userId/posts'>;
let userPostComment: Resource<
  Comment,
  Comment,
  'users/:userId/posts/:postId/comments'
>;

const id = 123;
const data = { name: 'John', email: 'john.smith@example.org' };
const searchParams = new URLSearchParams({ foo: 'bar' });

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
  fetchMock.mockResponse('{"foo": "bar"}');

  api = Api.create('http://example.org');

  user = api.createResource<User>().route('users');
  userPost = api.createResource<Post>().route('users/:userId/posts');
  userPostComment = api
    .createResource<Comment>()
    .route('users/:userId/posts/:postId/comments');
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

    user.search(searchParams);

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users?${searchParams}`,
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

    userPost.search(searchParams, { userId: 1 });

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users/1/posts?${searchParams}`,
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

  it('read (undefined route params)', () => {
    // @ts-ignore
    const spy = jest.spyOn(user.api, 'request');

    // @ts-ignore: We want to test that case even if TS complains
    userPostComment.read(id, { userId: 1 });

    expect(spy).toHaveBeenCalledWith(
      'GET',
      `users/1/posts/:postId/comments/${id}`,
      undefined,
      undefined,
    );
  });
});
