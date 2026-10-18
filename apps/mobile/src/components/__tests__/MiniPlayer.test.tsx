import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";

import { usePlayer } from "@/context/PlayerContext";
import { MiniPlayer } from "../MiniPlayer";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

jest.mock("@/context/PlayerContext", () => ({
  usePlayer: jest.fn(),
  usePlayerProgress: () => ({ progressMs: 30_000, durationMs: 120_000 }),
}));

const mockedUsePlayer = usePlayer as jest.Mock;
const track = { spotify_uri: "spotify:track:a", name: "Song A", artist: "Artist", image_url: "" };

describe("MiniPlayer", () => {
  const toggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePlayer.mockReturnValue({
      current: track,
      isPlaying: true,
      toggle,
      next: jest.fn(),
      previous: jest.fn(),
    });
  });

  it("should render nothing when nothing is playing", async () => {
    mockedUsePlayer.mockReturnValue({ current: null });

    await render(<MiniPlayer />);

    expect(screen.toJSON()).toBeNull();
  });

  it("should show the current track and open Now Playing when pressed", async () => {
    await render(<MiniPlayer />);

    expect(screen.getByText("Song A")).toBeTruthy();
    expect(screen.getByText("Artist")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Open now playing"));

    expect(router.push).toHaveBeenCalledWith("/player");
  });

  it("should pause and resume", async () => {
    await render(<MiniPlayer />);

    await fireEvent.press(screen.getByLabelText("Pause"));

    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it("should offer to play when paused", async () => {
    mockedUsePlayer.mockReturnValue({ ...mockedUsePlayer(), isPlaying: false });

    await render(<MiniPlayer />);

    expect(screen.getByLabelText("Play")).toBeTruthy();
  });
});
