import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";

import { TabBar } from "../TabBar";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../MiniPlayer", () => ({ MiniPlayer: () => null }));

type Props = ComponentProps<typeof TabBar>;

const routes = [
  { key: "index-1", name: "index" },
  { key: "search-1", name: "search" },
  { key: "rooms-1", name: "rooms" },
  { key: "about-1", name: "about" },
];

const descriptors = {
  "index-1": { options: { title: "Home" } },
  "search-1": { options: { title: "Search" } },
  "rooms-1": { options: {} },
  "about-1": { options: { title: "About" } },
};

describe("TabBar", () => {
  const navigate = jest.fn();
  const emit = jest.fn(() => ({ defaultPrevented: false }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function renderTabBar(index = 0) {
    const props = {
      state: { index, routes },
      descriptors,
      navigation: { navigate, emit },
    } as unknown as Props;
    await render(<TabBar {...props} />);
  }

  it("should show a button for each main tab, but not for About", async () => {
    await renderTabBar();

    expect(screen.getByLabelText("Home")).toBeTruthy();
    expect(screen.getByLabelText("Search")).toBeTruthy();
    // Falls back to the route name when the screen has no title
    expect(screen.getByLabelText("rooms")).toBeTruthy();
    expect(screen.queryByLabelText("About")).toBeNull();
  });

  it("should mark the focused tab as selected", async () => {
    await renderTabBar(1);

    expect(screen.getByLabelText("Search").props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText("Home").props.accessibilityState).toEqual({ selected: false });
  });

  it("should navigate to another tab when pressed", async () => {
    await renderTabBar();

    await fireEvent.press(screen.getByLabelText("Search"));

    expect(emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "search-1",
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith("search");
  });

  it("should not navigate when pressing the tab that is already open", async () => {
    await renderTabBar();

    await fireEvent.press(screen.getByLabelText("Home"));

    expect(navigate).not.toHaveBeenCalled();
  });

  it("should not navigate when a listener prevents the tab press", async () => {
    emit.mockReturnValueOnce({ defaultPrevented: true });
    await renderTabBar();

    await fireEvent.press(screen.getByLabelText("Search"));

    expect(navigate).not.toHaveBeenCalled();
  });
});
