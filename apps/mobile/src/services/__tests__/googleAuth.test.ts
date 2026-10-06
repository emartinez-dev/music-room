import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { GOOGLE_WEB_CLIENT_ID } from "../../../config";
import { googleLoginApi } from "../auth";
import { handleGoogleSignIn } from "../googleAuth";

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signOut: jest.fn(),
    signIn: jest.fn(),
  },
}));

jest.mock("../auth", () => ({
  googleLoginApi: jest.fn(),
}));

const mockedGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;
const mockedGoogleLoginApi = googleLoginApi as jest.Mock;

// configure() runs as an import side effect, so its call is captured here,
// before the beforeEach hook below clears the mock.
const configureCallsAtImport = [...mockedGoogleSignin.configure.mock.calls];

describe("handleGoogleSignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGoogleSignin.hasPlayServices.mockResolvedValue(true);
    mockedGoogleSignin.signOut.mockResolvedValue(undefined as never);
  });

  it("should configure the Google client with the app web client id on import", () => {
    expect(configureCallsAtImport).toEqual([[{ webClientId: GOOGLE_WEB_CLIENT_ID }]]);
  });

  it("should exchange the Google idToken for app tokens", async () => {
    mockedGoogleSignin.signIn.mockResolvedValue({
      data: { idToken: "google-id-token" },
    } as never);
    mockedGoogleLoginApi.mockResolvedValue({
      access: "access-token",
      refresh: "refresh-token",
      user: { id: "1", email: "user@example.com" },
    });

    const result = await handleGoogleSignIn();

    expect(mockedGoogleLoginApi).toHaveBeenCalledWith("google-id-token");
    expect(result).toEqual({
      access: "access-token",
      refresh: "refresh-token",
      user: { id: "1", email: "user@example.com" },
    });
  });

  // signOut() before signIn() is what forces the account picker to appear again
  // instead of silently reusing the last Google account.
  it("should check Play Services and sign out before signing in", async () => {
    mockedGoogleSignin.signIn.mockResolvedValue({
      data: { idToken: "google-id-token" },
    } as never);
    mockedGoogleLoginApi.mockResolvedValue({});

    await handleGoogleSignIn();

    expect(mockedGoogleSignin.hasPlayServices).toHaveBeenCalled();
    expect(mockedGoogleSignin.signOut).toHaveBeenCalled();
    expect(mockedGoogleSignin.signOut.mock.invocationCallOrder[0]).toBeLessThan(
      mockedGoogleSignin.signIn.mock.invocationCallOrder[0],
    );
  });

  it("should throw and not call the API when Google returns no idToken", async () => {
    mockedGoogleSignin.signIn.mockResolvedValue({ data: { idToken: null } } as never);

    await expect(handleGoogleSignIn()).rejects.toThrow("Google Sign-In did not return an idToken");
    expect(mockedGoogleLoginApi).not.toHaveBeenCalled();
  });

  it("should throw when the user cancels and Google returns no data", async () => {
    mockedGoogleSignin.signIn.mockResolvedValue({ data: null } as never);

    await expect(handleGoogleSignIn()).rejects.toThrow("Google Sign-In did not return an idToken");
    expect(mockedGoogleLoginApi).not.toHaveBeenCalled();
  });

  it("should propagate a Play Services failure without signing in", async () => {
    mockedGoogleSignin.hasPlayServices.mockRejectedValue(new Error("Play Services missing"));

    await expect(handleGoogleSignIn()).rejects.toThrow("Play Services missing");
    expect(mockedGoogleSignin.signIn).not.toHaveBeenCalled();
    expect(mockedGoogleLoginApi).not.toHaveBeenCalled();
  });
});
