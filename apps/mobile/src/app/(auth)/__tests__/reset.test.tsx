import { AxiosError } from "axios";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import ResetScreen from "../reset";
import { useSnackbar } from "@/context/SnackbarContext";
import { Api } from "@/services/api";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
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
const mockedApi = Api as { post: jest.Mock };
const mockedRouterReplace = router.replace as jest.Mock;

describe("ResetScreen", () => {
  const showSnackbar = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSnackbar.mockReturnValue({ showSnackbar });
  });

  it("should render the email input in the initial step", async () => {
    await render(<ResetScreen />);

    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByText("Request password reset")).toBeTruthy();
  });

  it("should request password reset and advance to the confirmation step", async () => {
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
      expect(showSnackbar).toHaveBeenCalledWith(
        "Please check user@example.com for your verification code",
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Verification code")).toBeTruthy();
      expect(screen.getByLabelText("New password")).toBeTruthy();
      expect(screen.getByText("Reset password")).toBeTruthy();
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

  it("should reset password and navigate to login on success", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });

    await render(<ResetScreen />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.press(screen.getByText("Request password reset"));

    await waitFor(() => {
      expect(screen.getByLabelText("Verification code")).toBeTruthy();
    });

    await fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
    await fireEvent.changeText(screen.getByLabelText("New password"), "new-password");
    await fireEvent.press(screen.getByText("Reset password"));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/reset-password/", {
        email: "user@example.com",
        token: "123456",
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
    mockedApi.post.mockResolvedValue({ data: {} });

    await render(<ResetScreen />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.press(screen.getByText("Request password reset"));

    await waitFor(() => {
      expect(screen.getByLabelText("Verification code")).toBeTruthy();
    });

    mockedApi.post.mockImplementation(() => new Promise(() => {}));

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

    mockedApi.post.mockResolvedValue({ data: {} });

    await render(<ResetScreen />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.press(screen.getByText("Request password reset"));

    await waitFor(() => {
      expect(screen.getByLabelText("Verification code")).toBeTruthy();
    });

    mockedApi.post.mockReset();
    mockedApi.post.mockRejectedValue(axiosError);

    await fireEvent.changeText(screen.getByLabelText("Verification code"), "000000");
    await fireEvent.changeText(screen.getByLabelText("New password"), "new-password");
    await fireEvent.press(screen.getByText("Reset password"));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Invalid or expired verification token");
    });
  });

  it("should show generic snackbar message on non-AxiosError during reset", async () => {
    mockedApi.post.mockResolvedValue({ data: {} });

    await render(<ResetScreen />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.press(screen.getByText("Request password reset"));

    await waitFor(() => {
      expect(screen.getByLabelText("Verification code")).toBeTruthy();
    });

    mockedApi.post.mockReset();
    mockedApi.post.mockRejectedValue(new Error("network error"));

    await fireEvent.changeText(screen.getByLabelText("Verification code"), "123456");
    await fireEvent.changeText(screen.getByLabelText("New password"), "new-password");
    await fireEvent.press(screen.getByText("Reset password"));

    await waitFor(() => {
      expect(showSnackbar).toHaveBeenCalledWith("Reset failed");
    });
  });
});
