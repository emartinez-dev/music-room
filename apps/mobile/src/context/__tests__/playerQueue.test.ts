import {
  initialPlayerState,
  type PlayerAction,
  type PlayerState,
  type PlayerTrack,
  playerReducer,
  upcomingFromSource,
} from "../playerQueue";

const track = (id: string): PlayerTrack => ({
  spotify_uri: `spotify:track:${id}`,
  name: `Song ${id}`,
  artist: "Artist",
  image_url: "",
});

const [a, b, c, d] = ["a", "b", "c", "d"].map(track);
const source = { id: "room:1", name: "Friday" };

function run(...actions: PlayerAction[]): PlayerState {
  return actions.reduce(playerReducer, initialPlayerState);
}

const playRoom = (first = a): PlayerAction => ({
  type: "play",
  track: first,
  tracks: [a, b, c],
  source,
});

const uris = (tracks: PlayerTrack[]) => tracks.map((t) => t.spotify_uri);

describe("playerReducer", () => {
  it("should start playing the chosen track of the source", () => {
    const state = run(playRoom(b));

    expect(state.current).toBe(b);
    expect(state.isPlaying).toBe(true);
    expect(uris(upcomingFromSource(state))).toEqual([c.spotify_uri]);
  });

  describe("next and previous", () => {
    it("should go through the source in order", () => {
      expect(run(playRoom(), { type: "next" }).current).toBe(b);
      expect(run(playRoom(), { type: "next" }, { type: "next" }).current).toBe(c);
    });

    it("should go back to the previous track", () => {
      const state = run(playRoom(b), { type: "previous", progressMs: 0 });

      expect(state.current).toBe(a);
    });

    it("should restart the track when going back after a few seconds", () => {
      const before = run(playRoom(b));
      const state = playerReducer(before, { type: "previous", progressMs: 10_000 });

      expect(state.current).toBe(b);
      expect(state.playId).toBe(before.playId + 1);
    });

    it("should stop at the end of the source when repeat is off", () => {
      const state = run(playRoom(c), { type: "trackEnded" });

      expect(state.isPlaying).toBe(false);
      expect(state.current).toBe(a);
    });
  });

  describe("queue", () => {
    it("should play queued tracks before the rest of the source", () => {
      const state = run(playRoom(), { type: "addToQueue", track: d }, { type: "next" });

      expect(state.current).toBe(d);
      expect(state.fromQueue).toBe(true);
      expect(
        run(playRoom(), { type: "addToQueue", track: d }, { type: "next" }, { type: "next" })
          .current,
      ).toBe(b);
    });

    it("should return to the source when going back from a queued track", () => {
      const state = run(
        playRoom(),
        { type: "addToQueue", track: d },
        { type: "next" },
        { type: "previous", progressMs: 0 },
      );

      expect(state.current).toBe(a);
    });

    it("should remove and clear queued tracks", () => {
      const queued = run(
        playRoom(),
        { type: "addToQueue", track: c },
        { type: "addToQueue", track: d },
      );

      expect(playerReducer(queued, { type: "removeFromQueue", index: 0 }).upNext).toEqual([d]);
      expect(playerReducer(queued, { type: "clearQueue" }).upNext).toEqual([]);
    });

    it("should jump to a queued track and drop the ones before it", () => {
      const state = run(
        playRoom(),
        { type: "addToQueue", track: c },
        { type: "addToQueue", track: d },
        { type: "playFromQueue", index: 1 },
      );

      expect(state.current).toBe(d);
      expect(state.upNext).toEqual([]);
    });

    it("should start playing when queuing with nothing loaded", () => {
      const state = run({ type: "addToQueue", track: d });

      expect(state.current).toBe(d);
      expect(state.isPlaying).toBe(true);
    });
  });

  describe("repeat", () => {
    it("should cycle off, all, one", () => {
      expect(run({ type: "cycleRepeat" }).repeat).toBe("all");
      expect(run({ type: "cycleRepeat" }, { type: "cycleRepeat" }).repeat).toBe("one");
      expect(
        run({ type: "cycleRepeat" }, { type: "cycleRepeat" }, { type: "cycleRepeat" }).repeat,
      ).toBe("off");
    });

    it("should loop the whole source on repeat all", () => {
      const state = run({ type: "cycleRepeat" }, playRoom(c), { type: "trackEnded" });

      expect(state.current).toBe(a);
      expect(state.isPlaying).toBe(true);
    });

    it("should replay the same track on repeat one", () => {
      const before = run({ type: "cycleRepeat" }, { type: "cycleRepeat" }, playRoom(b));
      const state = playerReducer(before, { type: "trackEnded" });

      expect(state.current).toBe(b);
      expect(state.playId).toBe(before.playId + 1);
    });

    it("should still skip on next with repeat one", () => {
      const state = run({ type: "cycleRepeat" }, { type: "cycleRepeat" }, playRoom(), {
        type: "next",
      });

      expect(state.current).toBe(b);
    });
  });

  describe("shuffle", () => {
    it("should keep the current track first and play every other track once", () => {
      const state = run(playRoom(b), { type: "toggleShuffle" });

      expect(state.shuffle).toBe(true);
      expect(state.order[state.index]).toBe(b);
      expect(uris(upcomingFromSource(state)).sort()).toEqual(uris([a, c]).sort());
    });

    it("should go back to the original order when turned off", () => {
      const state = run(playRoom(b), { type: "toggleShuffle" }, { type: "toggleShuffle" });

      expect(state.order).toEqual([a, b, c]);
      expect(state.order[state.index]).toBe(b);
    });

    it("should shuffle a newly played source when shuffle is already on", () => {
      const state = run({ type: "toggleShuffle" }, playRoom(c));

      expect(state.order[0]).toBe(c);
      expect(state.order).toHaveLength(3);
    });
  });

  describe("with nothing loaded", () => {
    it("should ignore playback controls", () => {
      for (const action of [
        { type: "toggle" },
        { type: "next" },
        { type: "trackEnded" },
        { type: "previous", progressMs: 0 },
      ] as PlayerAction[]) {
        expect(playerReducer(initialPlayerState, action)).toBe(initialPlayerState);
      }
    });
  });

  it("should pause and resume", () => {
    const paused = run(playRoom(), { type: "toggle" });

    expect(paused.isPlaying).toBe(false);
    expect(playerReducer(paused, { type: "toggle" }).isPlaying).toBe(true);
  });

  describe("previous at the start of the source", () => {
    it("should wrap around to the last track on repeat all", () => {
      const state = run({ type: "cycleRepeat" }, playRoom(), { type: "previous", progressMs: 0 });

      expect(state.current).toBe(c);
    });

    it("should restart the first track when repeat is off", () => {
      const before = run(playRoom());
      const state = playerReducer(before, { type: "previous", progressMs: 0 });

      expect(state.current).toBe(a);
      expect(state.playId).toBe(before.playId + 1);
    });
  });

  it("should jump to a track later in the source", () => {
    expect(run(playRoom(), { type: "playFromOrder", index: 2 }).current).toBe(c);
  });

  it("should ignore jumps to tracks that don't exist", () => {
    const before = run(playRoom(), { type: "addToQueue", track: d });

    expect(playerReducer(before, { type: "playFromOrder", index: 9 })).toBe(before);
    expect(playerReducer(before, { type: "playFromQueue", index: 9 })).toBe(before);
  });

  it("should keep shuffle and repeat preferences when stopping", () => {
    const state = run({ type: "toggleShuffle" }, { type: "cycleRepeat" }, playRoom(), {
      type: "stop",
    });

    expect(state.current).toBeNull();
    expect(state.shuffle).toBe(true);
    expect(state.repeat).toBe("all");
  });
});
