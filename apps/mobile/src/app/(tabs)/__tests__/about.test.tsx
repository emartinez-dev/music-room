import { render, screen } from "@testing-library/react-native";

import AboutScreen from "../about";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(), navigate: jest.fn() },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("About screen", () => {
  it("should render the app name and its features", async () => {
    await render(<AboutScreen />);

    expect(screen.getByText("Music Room")).toBeTruthy();
    expect(screen.getByText("Listen together")).toBeTruthy();
  });
});
