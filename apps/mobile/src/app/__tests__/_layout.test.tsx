import { render, screen } from "@testing-library/react-native";

import { useAuth } from "@/context/AuthContext";
import RootLayout from "../_layout";

// expo-router's Stack is replaced by a minimal stand-in that renders the name
// of each declared screen, so the guard logic can be asserted through what is
// actually reachable.
jest.mock("expo-router", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);

  Stack.Screen = ({ name }: { name: string }) => React.createElement(Text, null, name);
  Stack.Protected = ({ guard, children }: { guard: boolean; children: React.ReactNode }) =>
    guard ? React.createElement(View, null, children) : null;

  return { Stack };
});

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    PaperProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("@/context/SnackbarContext", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SnackbarProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useSnackbar: () => ({ showSnackbar: jest.fn() }),
  };
});

jest.mock("@/context/AuthContext", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    useAuth: jest.fn(),
  };
});

jest.mock("@/mocks/mocks", () => ({
  setupMocks: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing while the stored session is being checked", async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, isCheckingAuth: true });

    await render(<RootLayout />);

    expect(screen.queryByText("(tabs)")).toBeNull();
    expect(screen.queryByText("(auth)")).toBeNull();
  });

  it("should expose only the auth screens to a signed out user", async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, isCheckingAuth: false });

    await render(<RootLayout />);

    expect(screen.getByText("(auth)")).toBeTruthy();
    expect(screen.queryByText("(tabs)")).toBeNull();
  });

  it("should expose only the app tabs to a signed in user", async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true, isCheckingAuth: false });

    await render(<RootLayout />);

    expect(screen.getByText("(tabs)")).toBeTruthy();
    expect(screen.queryByText("(auth)")).toBeNull();
  });
});
