import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import LoginScreen from "../login";
import { useAuth } from "@/context/AuthContext";
import { handleGoogleSignIn } from "@/services/googleAuth";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/googleAuth", () => ({
  handleGoogleSignIn: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedRouterPush = router.push as jest.Mock;
const mockedHandleGoogleSignIn = handleGoogleSignIn as jest.Mock;

describe("LoginScreen", () => {
  const login = jest.fn();
  const loginWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      login,
      loginWithGoogle,
      isLoading: false,
    });
  });

  it("should render the login form", async () => {
    await render(<LoginScreen />);

    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByText("Log in")).toBeTruthy();
    expect(screen.getByText("Continue with Google")).toBeTruthy();
  });

  it("should call login with email and password on submit", async () => {
    await render(<LoginScreen />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    await fireEvent.press(screen.getByText("Log in"));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("user@example.com", "secret");
    });
  });

  it("should navigate to reset password screen", async () => {
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByText("Forgot your password?"));

    expect(mockedRouterPush).toHaveBeenCalledWith("/(auth)/reset");
  });

  it("should navigate to register screen", async () => {
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByText("Create an account"));

    expect(mockedRouterPush).toHaveBeenCalledWith("/(auth)/register");
  });

  it("should call loginWithGoogle when Google button is pressed", async () => {
    mockedHandleGoogleSignIn.mockResolvedValue({
      access: "access",
      refresh: "refresh",
      user: { id: "1", email: "google@example.com" },
    });

    await render(<LoginScreen />);

    await fireEvent.press(screen.getByText("Continue with Google"));

    await waitFor(() => {
      expect(mockedHandleGoogleSignIn).toHaveBeenCalled();
      expect(loginWithGoogle).toHaveBeenCalledWith({
        access: "access",
        refresh: "refresh",
        user: { id: "1", email: "google@example.com" },
      });
    });
  });

  it("should disable the login button while loading", async () => {
    mockedUseAuth.mockReturnValue({
      login,
      loginWithGoogle,
      isLoading: true,
    });

    await render(<LoginScreen />);

    expect(screen.getByText("Log in")).toBeDisabled();
  });
});
