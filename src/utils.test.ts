import { parseParams, replaceParams } from './utils';

describe('utils', () => {
  it('parseParams', () => {
    expect(parseParams('users')).toEqual([]);
    expect(parseParams('users/:userId')).toEqual(['userId']);
    expect(parseParams('users/:userId/posts')).toEqual(['userId']);
    expect(parseParams('users/:userId/posts/:postId')).toEqual([
      'userId',
      'postId',
    ]);
  });

  it('replaceParams', () => {
    expect(replaceParams('users', {})).toBe('users');
    expect(replaceParams('users', { foo: 'bar' })).toBe('users');

    expect(replaceParams('users/:userId', { userId: 1 })).toBe('users/1');
    expect(replaceParams('users/:userId/posts', { userId: 1 })).toBe(
      'users/1/posts',
    );
    expect(
      replaceParams('users/:userId/posts/:postId', { userId: 1, postId: 10 }),
    ).toBe('users/1/posts/10');
  });
});
