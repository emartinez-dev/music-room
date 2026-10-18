import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { listRoomsApi } from "@/services/rooms";
import HomeScreen from "../index";

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: { push: jest.fn() },
    // Run the focus callback once on mount, like a screen gaining focus
    useFocusEffect: (callback: () => void) => React.useEffect(callback, [callback]),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/context/PlayerContext", () => ({
  usePlayer: () => ({ stop: jest.fn() }),
}));

jest.mock("@/context/SnackbarContext", () => ({
  useSnackbar: () => ({ showSnackbar: jest.fn() }),
}));

jest.mock("@/services/rooms", () => ({
  listRoomsApi: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.Mock;
const mockedListRooms = listRoomsApi as jest.Mock;
const mockedPush = router.push as jest.Mock;

const rooms = [
  { id: 1, name: "Friday party", host_username: "alice" },
  { id: 2, name: "Road trip", host_username: "bob" },
];

describe("Home screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "alice@example.com", username: "alice" },
      spotifyLinked: true,
    });
    mockedListRooms.mockResolvedValue(rooms);
  });

  it("should welcome the user by username", async () => {
    await render(<HomeScreen />);

    expect(await screen.findByText("Welcome back, alice")).toBeTruthy();
  });

  it("should list the user's rooms and open one when pressed", async () => {
    await render(<HomeScreen />);

    const [quickAccess] = await screen.findAllByText("Road trip");
    await fireEvent.press(quickAccess);

    expect(mockedPush).toHaveBeenCalledWith("/rooms/2");
  });

  it("should only show rooms hosted by the user under the hosted filter", async () => {
    await render(<HomeScreen />);
    const before = (await screen.findAllByText("Road trip")).length;

    await fireEvent.press(screen.getAllByText("Hosted by you")[0]);

    // Road trip stays in the "Your rooms" carousel but leaves the quick access grid
    expect(screen.getAllByText("Road trip")).toHaveLength(before - 1);
    expect(screen.getAllByText("Friday party").length).toBeGreaterThan(1);
  });

  it("should offer to create a room when there are none", async () => {
    mockedListRooms.mockResolvedValue([]);

    await render(<HomeScreen />);
    await fireEvent.press(await screen.findByText("Create a room"));

    expect(mockedPush).toHaveBeenCalledWith({ pathname: "/rooms", params: { create: "1" } });
  });

  it("should let the user create another room when they already have some", async () => {
    await render(<HomeScreen />);
    await screen.findAllByText("Road trip");

    await fireEvent.press(screen.getByLabelText("Create room"));

    expect(mockedPush).toHaveBeenCalledWith({ pathname: "/rooms", params: { create: "1" } });
  });

  it("should prompt to link Spotify when the account is not linked", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "alice@example.com", username: "alice" },
      spotifyLinked: false,
    });

    await render(<HomeScreen />);
    await fireEvent.press(await screen.findByText("Link"));

    expect(mockedPush).toHaveBeenCalledWith("/spotify-link-modal");
  });
});
