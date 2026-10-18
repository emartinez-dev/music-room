import { act, renderHook } from "@testing-library/react-native";
import type React from "react";

import { PlayerProvider, type PlayerTrack, usePlayer, usePlayerProgress } from "../PlayerContext";

const track = (id: string, duration_ms?: number): PlayerTrack => ({
  spotify_uri: `spotify:track:${id}`,
  name: `Song ${id}`,
  artist: "Artist",
  image_url: "",
  duration_ms,
});

const a = track("a", 3000);
const b = track("b", 3000);
const c = track("c", 3000);
const source = { id: "room:1", name: "Friday" };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PlayerProvider>{children}</PlayerProvider>
);

async function renderPlayer() {
  return renderHook(() => ({ player: usePlayer(), progress: usePlayerProgress() }), { wrapper });
}

// Advances the fake clock one tick at a time, so each tick's effects run before the next one
async function tick(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
}

describe("PlayerContext", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should throw when used outside of a PlayerProvider", async () => {
    await expect(renderHook(() => usePlayer())).rejects.toThrow(
      "usePlayer must be used within a PlayerProvider",
    );
  });

  it("should start with nothing playing", async () => {
    const { result } = await renderPlayer();

    expect(result.current.player.current).toBeNull();
    expect(result.current.player.isPlaying).toBe(false);
    expect(result.current.progress.progressMs).toBe(0);
  });

  it("should advance the progress every second while playing", async () => {
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(a, [a, b, c], source));
    await tick(2);

    expect(result.current.progress).toEqual({ progressMs: 2000, durationMs: 3000 });
  });

  it("should not advance the progress while paused", async () => {
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(a, [a, b, c], source));
    await act(async () => result.current.player.toggle());
    await tick(2);

    expect(result.current.progress.progressMs).toBe(0);
  });

  it("should use a default duration for tracks without one", async () => {
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(track("x"), [], source));

    expect(result.current.progress.durationMs).toBe(3 * 60 * 1000);
  });

  it("should move on to the next track when the current one ends", async () => {
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(a, [a, b, c], source));
    await tick(3);

    expect(result.current.player.current).toBe(b);
    expect(result.current.progress.progressMs).toBe(0);
  });

  it("should restart the track on previous after a few seconds, and go back right after", async () => {
    const long = [track("a", 60_000), track("b", 60_000)];
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(long[1], long, source));
    await tick(5);
    await act(async () => result.current.player.previous());

    expect(result.current.player.current).toBe(long[1]);
    expect(result.current.progress.progressMs).toBe(0);

    await act(async () => result.current.player.previous());

    expect(result.current.player.current).toBe(long[0]);
  });

  it("should expose the queue and the rest of the source", async () => {
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(a, [a, b, c], source));
    await act(async () => result.current.player.addToQueue(c));

    expect(result.current.player.source).toEqual(source);
    expect(result.current.player.upNext).toEqual([c]);
    expect(result.current.player.upcoming).toEqual([b, c]);

    await act(async () => result.current.player.removeFromQueue(0));
    expect(result.current.player.upNext).toEqual([]);

    await act(async () => result.current.player.addToQueue(b));
    await act(async () => result.current.player.clearQueue());
    expect(result.current.player.upNext).toEqual([]);

    await act(async () => result.current.player.addToQueue(c));
    await act(async () => result.current.player.playFromQueue(0));
    expect(result.current.player.current).toBe(c);
  });

  it("should play a track from the rest of the source by its position", async () => {
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(a, [a, b, c], source));
    await act(async () => result.current.player.playUpcoming(1));

    expect(result.current.player.current).toBe(c);
  });

  it("should toggle shuffle, cycle repeat, skip and stop", async () => {
    const { result } = await renderPlayer();

    await act(async () => result.current.player.play(a, [a, b, c], source));
    await act(async () => result.current.player.toggleShuffle());
    await act(async () => result.current.player.cycleRepeat());
    expect(result.current.player.shuffle).toBe(true);
    expect(result.current.player.repeat).toBe("all");

    await act(async () => result.current.player.next());
    expect(result.current.player.current).not.toBe(a);

    await act(async () => result.current.player.stop());
    expect(result.current.player.current).toBeNull();
  });
});
