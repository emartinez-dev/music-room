import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import RegisterScreen from "../register";

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

describe("RegisterScreen", () => {
  const register = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      register,
      isLoading: false,
    });
  });

  it("should render the register form", async () => {
    await render(<RegisterScreen />);

    expect(screen.getByLabelText("Username")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByLabelText("Confirm Password")).toBeTruthy();
    expect(screen.getByText("Create account")).toBeTruthy();
  });

  it("should call register with the form values", async () => {
    await render(<RegisterScreen />);

    await fireEvent.changeText(screen.getByLabelText("Username"), "username");
    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    await fireEvent.changeText(screen.getByLabelText("Confirm Password"), "secret");
    await fireEvent.press(screen.getByText("Create account"));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("username", "user@example.com", "secret");
    });
  });

  it("should navigate to verify-email screen when registration succeeds", async () => {
    register.mockResolvedValue(true);

    await render(<RegisterScreen />);

    await fireEvent.changeText(screen.getByLabelText("Username"), "username");
    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    await fireEvent.changeText(screen.getByLabelText("Confirm Password"), "secret");
    await fireEvent.press(screen.getByText("Create account"));

    await waitFor(() => {
      expect(mockedRouterPush).toHaveBeenCalledWith({
        pathname: "/(auth)/verify-email",
        params: { email: "user@example.com" },
      });
    });
  });

  it("should not navigate to verify-email when registration fails", async () => {
    register.mockResolvedValue(false);

    await render(<RegisterScreen />);

    await fireEvent.changeText(screen.getByLabelText("Username"), "username");
    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    await fireEvent.changeText(screen.getByLabelText("Confirm Password"), "secret");
    await fireEvent.press(screen.getByText("Create account"));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("username", "user@example.com", "secret");
    });

    expect(mockedRouterPush).not.toHaveBeenCalled();
  });

  it("should not call register when passwords do not match", async () => {
    await render(<RegisterScreen />);

    await fireEvent.changeText(screen.getByLabelText("Username"), "username");
    await fireEvent.changeText(screen.getByLabelText("Email"), "user@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "secret");
    await fireEvent.changeText(screen.getByLabelText("Confirm Password"), "different");
    await fireEvent.press(screen.getByText("Create account"));

    expect(register).not.toHaveBeenCalled();
  });

  it("should navigate to login screen", async () => {
    await render(<RegisterScreen />);

    await fireEvent.press(screen.getByText("Log in"));

    expect(mockedRouterPush).toHaveBeenCalledWith("/(auth)/login");
  });

  it("should disable the register button while loading", async () => {
    mockedUseAuth.mockReturnValue({
      register,
      isLoading: true,
    });

    await render(<RegisterScreen />);

    expect(screen.getByText("Create account")).toBeDisabled();
  });
});
