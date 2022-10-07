import jestFetchMock from 'jest-fetch-mock';

jestFetchMock.enableMocks();

// @ts-ignore
global.FormData = jest.fn();
