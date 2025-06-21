import { parseRoute, buildRoute } from './utils';

describe('utils', () => {
  it('parseRoute', () => {
    expect(parseRoute('users')).toEqual([]);
    expect(parseRoute('users/:userId')).toEqual(['userId']);
    expect(parseRoute('users/:userId/posts')).toEqual(['userId']);
    expect(parseRoute('users/:userId/posts/:postId')).toEqual([
      'userId',
      'postId',
    ]);
  });

  it('buildRoute', () => {
    expect(buildRoute('users', {})).toBe('users');
    expect(buildRoute('users', { foo: 'bar' })).toBe('users');

    expect(buildRoute('users/:userId', { userId: 1 })).toBe('users/1');
    expect(buildRoute('users/:userId/posts', { userId: 1 })).toBe(
      'users/1/posts',
    );
    expect(
      buildRoute('users/:userId/posts/:postId', { userId: 1, postId: 10 }),
    ).toBe('users/1/posts/10');
  });
});
