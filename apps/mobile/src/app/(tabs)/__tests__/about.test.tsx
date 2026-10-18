import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";

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

  it("should go back to the previous screen", async () => {
    (router.canGoBack as jest.Mock).mockReturnValue(true);
    await render(<AboutScreen />);

    await fireEvent.press(screen.getByLabelText("Go back"));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("should go home when there is no screen to go back to", async () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);
    await render(<AboutScreen />);

    await fireEvent.press(screen.getByLabelText("Go back"));

    expect(router.navigate).toHaveBeenCalledWith("/");
  });
});
