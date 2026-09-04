import { render } from "@testing-library/react-native";
import { router, Stack } from "expo-router";

import AuthLayout from "../_layout";

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");

  // Stack renders its children so the layout mounts; Stack.Screen is a spy,
  // which lets the test read the options each screen is declared with.
  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);
  Stack.Screen = jest.fn(() => null);

  return {
    Stack,
    router: {
      back: jest.fn(),
      replace: jest.fn(),
      canGoBack: jest.fn(),
    },
  };
});

jest.mock("react-native-paper", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    IconButton: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

const mockedScreen = Stack.Screen as unknown as jest.Mock;
const mockedCanGoBack = router.canGoBack as jest.Mock;
const mockedBack = router.back as jest.Mock;
const mockedReplace = router.replace as jest.Mock;

function optionsFor(name: string) {
  const call = mockedScreen.mock.calls.find(([props]: [{ name: string }]) => props.name === name);
  return call?.[0]?.options ?? {};
}

describe("Auth layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should declare the four auth screens", async () => {
    await render(<AuthLayout />);

    const names = mockedScreen.mock.calls.map(([props]: [{ name: string }]) => props.name);
    expect(names).toEqual(["login", "register", "reset-password", "verify-email"]);
  });

  it("should hide the header on the login screen", async () => {
    await render(<AuthLayout />);

    expect(optionsFor("login")).toEqual({ headerShown: false });
  });

  it("should title the register and verify screens", async () => {
    await render(<AuthLayout />);

    expect(optionsFor("register").headerTitle).toBe("Create account");
    expect(optionsFor("verify-email").headerTitle).toBe("Verify email");
  });

  describe("reset-password back button", () => {
    // Re-implements what the navigator does: render the element the layout
    // hands to headerLeft, then fire its onPress.
    const pressBackButton = () => {
      const headerLeft = optionsFor("reset-password").headerLeft as () => {
        props: { onPress: () => void };
      };
      headerLeft().props.onPress();
    };

    it("should go back when there is history to go back to", async () => {
      mockedCanGoBack.mockReturnValue(true);

      await render(<AuthLayout />);
      pressBackButton();

      expect(mockedBack).toHaveBeenCalled();
      expect(mockedReplace).not.toHaveBeenCalled();
    });

    // Opening the reset link from an email starts a fresh stack, so there is
    // nothing to go back to and the button has to fall back to login.
    it("should fall back to the login screen when there is no history", async () => {
      mockedCanGoBack.mockReturnValue(false);

      await render(<AuthLayout />);
      pressBackButton();

      expect(mockedReplace).toHaveBeenCalledWith("/(auth)/login");
      expect(mockedBack).not.toHaveBeenCalled();
    });
  });
});
