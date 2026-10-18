import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import { ProfileDrawer } from "../ProfileDrawer";
import { ScreenHeader } from "../ScreenHeader";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));

const mockStop = jest.fn();
jest.mock("@/context/PlayerContext", () => ({ usePlayer: () => ({ stop: mockStop }) }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedPush = router.push as jest.Mock;

describe("ProfileDrawer", () => {
  const logout = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "alice@example.com", username: "alice" },
      spotifyLinked: true,
      logout,
    });
  });

  it("should show the user and open their profile", async () => {
    await render(<ProfileDrawer visible onClose={onClose} />);

    expect(screen.getByText("alice")).toBeTruthy();
    await fireEvent.press(screen.getByText("View profile"));

    expect(onClose).toHaveBeenCalled();
    expect(mockedPush).toHaveBeenCalledWith("/profile");
  });

  it("should fall back to the email when the user has no username", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "alice@example.com" },
      spotifyLinked: true,
      logout,
    });

    await render(<ProfileDrawer visible onClose={onClose} />);

    expect(screen.getByText("alice@example.com")).toBeTruthy();
  });

  it("should show that Spotify is connected", async () => {
    await render(<ProfileDrawer visible onClose={onClose} />);

    expect(screen.getByText("Spotify connected")).toBeTruthy();
    expect(screen.queryByText("Connect Spotify")).toBeNull();
  });

  it("should offer to connect Spotify when it is not linked", async () => {
    mockedUseAuth.mockReturnValue({ user: null, spotifyLinked: false, logout });

    await render(<ProfileDrawer visible onClose={onClose} />);
    await fireEvent.press(screen.getByText("Connect Spotify"));

    expect(mockedPush).toHaveBeenCalledWith("/spotify-link-modal");
  });

  it("should open the about screen", async () => {
    await render(<ProfileDrawer visible onClose={onClose} />);

    await fireEvent.press(screen.getByText("About Music Room"));

    expect(mockedPush).toHaveBeenCalledWith("/about");
  });

  it("should stop playback and log out", async () => {
    await render(<ProfileDrawer visible onClose={onClose} />);

    await fireEvent.press(screen.getByText("Log out"));

    expect(onClose).toHaveBeenCalled();
    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("should close when the backdrop is pressed", async () => {
    await render(<ProfileDrawer visible onClose={onClose} />);

    await fireEvent.press(screen.getByLabelText("Close menu"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ScreenHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { id: "1", email: "alice@example.com", username: "alice" },
      spotifyLinked: true,
      logout: jest.fn(),
    });
  });

  it("should show the title and the right-hand content", async () => {
    const { Text } = require("react-native");
    await render(<ScreenHeader title="Your Library" right={<Text>Extra</Text>} />);

    expect(screen.getByText("Your Library")).toBeTruthy();
    expect(screen.getByText("Extra")).toBeTruthy();
  });

  it("should open the account drawer from the avatar, and close it again", async () => {
    await render(<ScreenHeader title="Home" />);
    expect(screen.queryByText("View profile")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Open profile"));
    expect(screen.getByText("View profile")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Close menu"));
    expect(screen.queryByText("View profile")).toBeNull();
  });
});
