import { AxiosError } from "axios";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import VerifyEmailScreen from "../verify-email";
import { useAuth } from "@/context/AuthContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
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

jest.mock("@/services/secureStore", () => ({
  saveTokens: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseSnackbar = useSnackbar as jest.Mock;
const mockedApi = Api as { post: jest.Mock };
const mockedRouterReplace = router.replace as jest.Mock;

describe("VerifyEmailScreen", () => {
  const checkAuth = jest.fn();
  const me = jest.fn();
  const showSnackbar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      checkAuth,
      me,
    });
    mockedUseSnackbar.mockReturnValue({ showSnackbar });
  });

  it("should render the verification form", async () => {
    await render(<VerifyEmailScreen />);

    expect(screen.getByLabelText("Verification code")).toBeTruthy();
    expect(screen.getByText("Verify email")).toBeTruthy();
  });

  it("should verify email, save tokens, and navigate on success", async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        access: "access-token",
        refresh: "refresh-token",
      },
    });

    await render(<VerifyEmailScreen />);

    await fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
    await fireEvent.press(screen.getByText("Verify email"));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/verify-email/", {
        token: "123456",
      });
    });

    await waitFor(() => {
      expect(mockedRouterReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });

  it("should disable the verify button while loading", async () => {
    mockedApi.post.mockImplementation(() => new Promise(() => {}));

    await render(<VerifyEmailScreen />);

    await fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");

    await act(async () => {
      fireEvent.press(screen.getByText("Verify email"));
    });

    await waitFor(() => {
      expect(screen.getByText("Verify email")).toBeDisabled();
    });
  });

  it("should show snackbar with error message on AxiosError", async () => {
    const axiosError = new AxiosError("test error", "test_code", undefined, undefined, {
      data: { message: "Invalid or expired verification token" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {},
    } as never);

    mockedApi.post.mockRejectedValue(axiosError);

    await render(<VerifyEmailScreen />);

    await fireEvent.changeText(screen.getByLabelText("Verification code"), "000000");
    await fireEvent.press(screen.getByText("Verify email"));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Invalid or expired verification token");
    });
  });

  it("should show generic snackbar message on non-AxiosError", async () => {
    mockedApi.post.mockRejectedValue(new Error("network error"));

    await render(<VerifyEmailScreen />);

    await fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
    await fireEvent.press(screen.getByText("Verify email"));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Please try again");
    });
  });
});
