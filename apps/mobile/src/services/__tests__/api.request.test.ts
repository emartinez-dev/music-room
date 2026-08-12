jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../sessionManager', () => ({
  sessionExpired: jest.fn(),
}));

import { Api } from '../api';
import * as SecureStore from 'expo-secure-store';

const mockedGetItemAsync = SecureStore.getItemAsync as jest.Mock;

describe('Api request interceptor', () => {
  let originalAdapter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    originalAdapter = (Api.defaults as any).adapter;
  });

  afterEach(() => {
    (Api.defaults as any).adapter = originalAdapter;
  });

  it('should attach Authorization header with the access token string from secure store', async () => {
    const accessToken = 'valid-access-token';
    mockedGetItemAsync.mockResolvedValue(accessToken);

    let capturedConfig: any = null;

    (Api.defaults as any).adapter = async (config: any) => {
      capturedConfig = config;
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
      });
    };

    try {
      await Api.get('/test');
    } catch {
      // ignore
    }

    expect(mockedGetItemAsync).toHaveBeenCalledWith('access-token');
    expect(capturedConfig.headers.Authorization).toBe(`Bearer ${accessToken}`);
  });
});