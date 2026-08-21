import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";
import ResetScreen from "../reset";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/context/SnackbarContext", () => ({
  useSnackbar: jest.fn(),
}));

jest.mock("@/services/api", () => ({
  Api: {
    post: jest.fn(),
  },
}));

const mockedUseSnackbar = useSnackbar as jest.Mock;
const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockedApi = Api as { post: jest.Mock };
const mockedRouterReplace = router.replace as jest.Mock;

describe("ResetScreen", () => {
  const showSnackbar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSnackbar.mockReturnValue({ showSnackbar });
    mockedUseLocalSearchParams.mockReturnValue({});
  });

  describe("request step (no token in the URL)", () => {
    it("should render the email input", async () => {
      await render(<ResetScreen />);

      expect(screen.getByLabelText("Email")).toBeTruthy();
      expect(screen.getByText("Request password reset")).toBeTruthy();
    });

    it("should request password reset and show a confirmation message", async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
      await fireEvent.press(screen.getByText("Request password reset"));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith("/auth/request-password-reset/", {
          email: "user@example.com",
        });
      });

      await waitFor(() => {
        expect(showSnackbar).toHaveBeenCalledWith("Please check user@example.com for a reset link");
      });

      await waitFor(() => {
        expect(screen.getByText("Check your email")).toBeTruthy();
      });
    });

    it("should disable the request button while loading", async () => {
      mockedApi.post.mockImplementation(() => new Promise(() => {}));

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");

      await act(async () => {
        fireEvent.press(screen.getByText("Request password reset"));
      });

      await waitFor(() => {
        expect(screen.getByText("Request password reset")).toBeDisabled();
      });
    });

    it("should show snackbar with error message on request failure", async () => {
      const axiosError = new AxiosError("test error", "test_code", undefined, undefined, {
        data: { message: "Something went wrong" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {},
      } as never);

      mockedApi.post.mockRejectedValue(axiosError);

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
      await fireEvent.press(screen.getByText("Request password reset"));

      await waitFor(() => {
        expect(showSnackbar).toHaveBeenCalledWith("Something went wrong");
      });
    });

    it("should show generic snackbar message on non-AxiosError during request", async () => {
      mockedApi.post.mockRejectedValue(new Error("network error"));

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
      await fireEvent.press(screen.getByText("Request password reset"));

      await waitFor(() => {
        expect(showSnackbar).toHaveBeenCalledWith("Request failed");
      });
    });
  });

  describe("confirm step (token present in the URL)", () => {
    beforeEach(() => {
      mockedUseLocalSearchParams.mockReturnValue({
        token: "the-token",
        email: "user@example.com",
      });
    });

    it("should render only the new password input", async () => {
      await render(<ResetScreen />);

      expect(screen.getByLabelText("New password")).toBeTruthy();
      expect(screen.getByText("Reset password")).toBeTruthy();
      expect(screen.queryByLabelText("Email")).toBeNull();
    });

    it("should reset password and navigate to login on success", async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("New password"), "new-password");
      await fireEvent.press(screen.getByText("Reset password"));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith("/auth/reset-password/", {
          email: "user@example.com",
          token: "the-token",
          new_password: "new-password",
        });
      });

      await waitFor(() => {
        expect(showSnackbar).toHaveBeenCalledWith("Password reset successful. Please log in.");
      });

      await waitFor(() => {
        expect(mockedRouterReplace).toHaveBeenCalledWith("/(auth)/login");
      });
    });

    it("should disable the reset button while loading", async () => {
      mockedApi.post.mockImplementation(() => new Promise(() => {}));

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("New password"), "new-password");

      await act(async () => {
        fireEvent.press(screen.getByText("Reset password"));
      });

      await waitFor(() => {
        expect(screen.getByText("Reset password")).toBeDisabled();
      });
    });

    it("should show snackbar with error message on reset failure", async () => {
      const axiosError = new AxiosError("test error", "test_code", undefined, undefined, {
        data: { message: "Invalid or expired verification token" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {},
      } as never);

      mockedApi.post.mockRejectedValue(axiosError);

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("New password"), "new-password");
      await fireEvent.press(screen.getByText("Reset password"));

      await waitFor(() => {
        expect(showSnackbar).toHaveBeenCalledWith("Invalid or expired verification token");
      });
    });

    it("should show generic snackbar message on non-AxiosError during reset", async () => {
      mockedApi.post.mockRejectedValue(new Error("network error"));

      await render(<ResetScreen />);

      await fireEvent.changeText(screen.getByLabelText("New password"), "new-password");
      await fireEvent.press(screen.getByText("Reset password"));

      await waitFor(() => {
        expect(showSnackbar).toHaveBeenCalledWith("Reset failed");
      });
    });
  });
});
