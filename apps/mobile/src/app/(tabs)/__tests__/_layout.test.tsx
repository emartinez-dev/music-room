import { render, screen } from "@testing-library/react-native";
import { Tabs } from "expo-router";

import TabLayout from "../_layout";

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");

  // Renders the custom tab bar too, so the test can check it is the one plugged in
  const Tabs = ({
    children,
    tabBar,
  }: {
    children: React.ReactNode;
    tabBar: (props: object) => React.ReactNode;
  }) => React.createElement(View, null, children, tabBar({}));
  Tabs.Screen = jest.fn(() => null);

  return { Tabs };
});

jest.mock("@/components/TabBar", () => {
  const { Text } = require("react-native");
  return { TabBar: () => <Text>Custom tab bar</Text> };
});

const mockedScreen = Tabs.Screen as unknown as jest.Mock;

describe("Tab layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should declare Home, Search, Your Library and About tabs in that order", async () => {
    await render(<TabLayout />);

    expect(mockedScreen.mock.calls.map(([props]: [{ name: string }]) => props.name)).toEqual([
      "index",
      "search",
      "rooms",
      "about",
    ]);
    expect(
      mockedScreen.mock.calls.map(
        ([props]: [{ options: { title: string } }]) => props.options.title,
      ),
    ).toEqual(["Home", "Search", "Your Library", "About"]);
  });

  it("should use the custom tab bar", async () => {
    await render(<TabLayout />);

    expect(screen.getByText("Custom tab bar")).toBeTruthy();
  });
});
