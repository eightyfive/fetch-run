import { createLogger } from './logger';

describe('createLogger', () => {
  beforeEach(() => {
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(142)
      .mockReturnValueOnce(200)
      .mockReturnValueOnce(275);

    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes downstream elapsed time in successful and error status lines', async () => {
    const success = createLogger({ verbose: false })(async () => {
      return new Response(null, { status: 200 });
    });
    const failure = createLogger({ verbose: false })(async () => {
      return new Response(null, { status: 500 });
    });

    await success(new Request('https://api.example.test/users'));
    await failure(new Request('https://api.example.test/users', { method: 'POST' }));

    expect(console.log).toHaveBeenCalledWith('GET /users (200) 42ms');
    expect(console.error).toHaveBeenCalledWith('POST /users (500) 75ms');
  });
});
