import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";
import { resendVerificationApi } from "@/services/auth";
import { saveTokens } from "@/services/secureStore";
import VerifyEmailScreen from "../verify-email";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/context/SnackbarContext", () => ({
  useSnackbar: jest.fn(),
}));

jest.mock("@/services/api", () => ({
  Api: {
    post: jest.fn(),
  },
}));

jest.mock("@/services/auth", () => ({
  resendVerificationApi: jest.fn(),
}));

jest.mock("@/services/secureStore", () => ({
  saveTokens: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseSnackbar = useSnackbar as jest.Mock;
const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockedApi = Api as unknown as { post: jest.Mock };
const mockedResendVerificationApi = resendVerificationApi as jest.Mock;
const mockedRouterReplace = router.replace as jest.Mock;
const mockedSaveTokens = saveTokens as jest.Mock;

let tokenCounter = 0;

describe("VerifyEmailScreen", () => {
  const checkAuth = jest.fn();
  const me = jest.fn();
  const showSnackbar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    tokenCounter += 1;
    mockedUseAuth.mockReturnValue({ checkAuth, me });
    mockedUseSnackbar.mockReturnValue({ showSnackbar });
    mockedUseLocalSearchParams.mockReturnValue({});
  });

  it("should show a message and no resend button when there is no token or email", async () => {
    await render(<VerifyEmailScreen />);

    expect(screen.getByText("Open the link from your email to verify your account.")).toBeTruthy();
    expect(screen.queryByText("Resend verification email")).toBeNull();
  });

  it("should auto-verify with the token from the URL, save tokens, and navigate on success", async () => {
    const token = `token-${tokenCounter}`;
    mockedUseLocalSearchParams.mockReturnValue({ token });
    mockedApi.post.mockResolvedValue({
      data: { access: "access-token", refresh: "refresh-token" },
    });

    await render(<VerifyEmailScreen />);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/verify-email/", { token });
    });

    await waitFor(() => {
      expect(mockedRouterReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("should show snackbar with error message on AxiosError", async () => {
    const token = `token-${tokenCounter}`;
    mockedUseLocalSearchParams.mockReturnValue({ token });

    const axiosError = new AxiosError("test error", "test_code", undefined, undefined, {
      data: { message: "Invalid or expired verification token" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {},
    } as never);

    mockedApi.post.mockRejectedValue(axiosError);

    await render(<VerifyEmailScreen />);

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Invalid or expired verification token");
    });
  });

  it("should show generic snackbar message on non-AxiosError", async () => {
    const token = `token-${tokenCounter}`;
    mockedUseLocalSearchParams.mockReturnValue({ token });
    mockedApi.post.mockRejectedValue(new Error("network error"));

    await render(<VerifyEmailScreen />);

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Please try again");
    });
  });

  it("should show a resend button when email is present and call resendVerificationApi on press", async () => {
    mockedUseLocalSearchParams.mockReturnValue({ email: "user@example.com" });
    mockedResendVerificationApi.mockResolvedValue({ message: "sent" });

    await render(<VerifyEmailScreen />);

    await fireEvent.press(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(mockedResendVerificationApi).toHaveBeenCalledWith("user@example.com");
    });

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Verification email sent to user@example.com");
    });
  });

  it("should store the session returned by a successful verification", async () => {
    const token = `token-${tokenCounter}`;
    mockedUseLocalSearchParams.mockReturnValue({ token });
    mockedApi.post.mockResolvedValue({
      data: { access: "access-token", refresh: "refresh-token" },
    });

    await render(<VerifyEmailScreen />);

    await waitFor(() => {
      expect(mockedSaveTokens).toHaveBeenCalledWith("access-token", "refresh-token");
    });

    // The user must land on the tabs already logged in, so the auth state has
    // to be refreshed before navigating.
    await waitFor(() => {
      expect(checkAuth).toHaveBeenCalled();
      expect(me).toHaveBeenCalledWith(true);
    });
  });

  it("should stay on the screen and not store a session when verification fails", async () => {
    const token = `token-${tokenCounter}`;
    mockedUseLocalSearchParams.mockReturnValue({ token });
    mockedApi.post.mockRejectedValue(new Error("network error"));

    await render(<VerifyEmailScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Open the link from your email to verify your account."),
      ).toBeTruthy();
    });

    expect(mockedSaveTokens).not.toHaveBeenCalled();
    expect(mockedRouterReplace).not.toHaveBeenCalled();
  });

  it("should show a spinner while the token is being verified", async () => {
    const token = `token-${tokenCounter}`;
    mockedUseLocalSearchParams.mockReturnValue({ token });
    mockedApi.post.mockImplementation(() => new Promise(() => {}));

    await render(<VerifyEmailScreen />);

    expect(screen.queryByText("Open the link from your email to verify your account.")).toBeNull();
  });

  it("should show the API message when resending the verification email fails", async () => {
    mockedUseLocalSearchParams.mockReturnValue({ email: "user@example.com" });

    const axiosError = new AxiosError("test error", "test_code", undefined, undefined, {
      data: { message: "Too many requests, try again later" },
      status: 429,
      statusText: "Too Many Requests",
      headers: {},
      config: {},
    } as never);

    mockedResendVerificationApi.mockRejectedValue(axiosError);

    await render(<VerifyEmailScreen />);

    await fireEvent.press(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Too many requests, try again later");
    });
  });

  it("should show a generic message when resending fails without an API message", async () => {
    mockedUseLocalSearchParams.mockReturnValue({ email: "user@example.com" });
    mockedResendVerificationApi.mockRejectedValue(new Error("network error"));

    await render(<VerifyEmailScreen />);

    await fireEvent.press(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Could not resend email");
    });
  });

  it("should re-enable the resend button after a failure so the user can retry", async () => {
    mockedUseLocalSearchParams.mockReturnValue({ email: "user@example.com" });
    mockedResendVerificationApi.mockRejectedValue(new Error("network error"));

    await render(<VerifyEmailScreen />);

    await fireEvent.press(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(screen.getByText("Resend verification email")).not.toBeDisabled();
    });
  });

  it("should not re-verify a token that was already processed in this app session", async () => {
    const token = `token-${tokenCounter}`;
    mockedUseLocalSearchParams.mockReturnValue({ token });
    mockedApi.post.mockResolvedValue({
      data: { access: "access-token", refresh: "refresh-token" },
    });

    await render(<VerifyEmailScreen />);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledTimes(1);
    });

    cleanup();
    mockedApi.post.mockClear();

    // Simulates Android redelivering the link's Intent and remounting the screen
    // with the same token, e.g. after logging out and back in.
    await render(<VerifyEmailScreen />);

    expect(mockedApi.post).not.toHaveBeenCalled();

    cleanup();
  });
});
