import { fireEvent, render, screen } from "@testing-library/react-native";

import { useAuth } from "@/context/AuthContext";
import Index from "../index";

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Link: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;

describe("Home screen", () => {
  const logout = jest.fn();
  const me = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "user@example.com" },
      logout,
      me,
    });
  });

  it("should greet the logged in user by email", async () => {
    await render(<Index />);

    expect(screen.getByText("Hi user@example.com")).toBeTruthy();
  });

  it("should render without an email while the profile is still loading", async () => {
    mockedUseAuth.mockReturnValue({ user: null, logout, me });

    await render(<Index />);

    expect(screen.getByText("Home screen")).toBeTruthy();
    expect(screen.getByText("Hi")).toBeTruthy();
  });

  it("should log the user out when the log out button is pressed", async () => {
    await render(<Index />);

    await fireEvent.press(screen.getByText("Log out"));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("should fetch the profile when the user info button is pressed", async () => {
    await render(<Index />);

    await fireEvent.press(screen.getByText("Get User Info"));

    expect(me).toHaveBeenCalledTimes(1);
  });

  it("should link to the about screen", async () => {
    await render(<Index />);

    expect(screen.getByText("Go to About screen").props.href).toBe("/about");
  });
});
