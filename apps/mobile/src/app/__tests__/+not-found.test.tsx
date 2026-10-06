import { render, screen } from "@testing-library/react-native";

import NotFoundScreen from "../+not-found";

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);
  Stack.Screen = () => null;

  return {
    Stack,
    Link: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe("Not found screen", () => {
  it("should offer a way back to the home screen", async () => {
    await render(<NotFoundScreen />);

    const link = screen.getByText("Go back to Home screen!");

    expect(link.props.href).toBe("/");
  });
});
