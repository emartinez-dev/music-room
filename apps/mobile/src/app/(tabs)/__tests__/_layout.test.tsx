import { render } from "@testing-library/react-native";
import { Tabs } from "expo-router";

import TabLayout from "../_layout";

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Tabs = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);
  Tabs.Screen = jest.fn(() => null);

  return { Tabs };
});

const mockedScreen = Tabs.Screen as unknown as jest.Mock;

describe("Tab layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should declare a Home and an About tab in that order", async () => {
    await render(<TabLayout />);

    expect(mockedScreen.mock.calls.map(([props]: [{ name: string }]) => props.name)).toEqual([
      "index",
      "about",
    ]);
    expect(
      mockedScreen.mock.calls.map(
        ([props]: [{ options: { title: string } }]) => props.options.title,
      ),
    ).toEqual(["Home", "About"]);
  });
});
