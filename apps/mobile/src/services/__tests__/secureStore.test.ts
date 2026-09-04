import * as SecureStore from "expo-secure-store";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  setAccessToken,
  setRefreshToken,
} from "../secureStore";

const mockedSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockedGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockedDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

describe("secureStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // The key names are part of the contract between this module and the API
  // interceptors, so they are asserted literally on purpose.
  it("should store both tokens under the access-token and refresh-token keys", async () => {
    await saveTokens("the-access", "the-refresh");

    expect(mockedSetItemAsync).toHaveBeenCalledWith("access-token", "the-access");
    expect(mockedSetItemAsync).toHaveBeenCalledWith("refresh-token", "the-refresh");
    expect(mockedSetItemAsync).toHaveBeenCalledTimes(2);
  });

  it("should store each token individually", async () => {
    await setAccessToken("the-access");
    await setRefreshToken("the-refresh");

    expect(mockedSetItemAsync).toHaveBeenNthCalledWith(1, "access-token", "the-access");
    expect(mockedSetItemAsync).toHaveBeenNthCalledWith(2, "refresh-token", "the-refresh");
  });

  it("should read each token from its own key", async () => {
    mockedGetItemAsync.mockImplementation((key: string) =>
      Promise.resolve(key === "access-token" ? "the-access" : "the-refresh"),
    );

    await expect(getAccessToken()).resolves.toBe("the-access");
    await expect(getRefreshToken()).resolves.toBe("the-refresh");
  });

  it("should return null when a token was never stored", async () => {
    mockedGetItemAsync.mockResolvedValue(null);

    await expect(getAccessToken()).resolves.toBeNull();
    await expect(getRefreshToken()).resolves.toBeNull();
  });

  it("should delete both tokens on clearTokens", async () => {
    await clearTokens();

    expect(mockedDeleteItemAsync).toHaveBeenCalledWith("access-token");
    expect(mockedDeleteItemAsync).toHaveBeenCalledWith("refresh-token");
    expect(mockedDeleteItemAsync).toHaveBeenCalledTimes(2);
  });

  it("should reject if the secure store fails to write", async () => {
    mockedSetItemAsync.mockRejectedValue(new Error("keychain unavailable"));

    await expect(saveTokens("a", "b")).rejects.toThrow("keychain unavailable");
  });
});
