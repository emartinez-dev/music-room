export type PlayerTrack = {
  spotify_uri: string;
  name: string;
  artist: string;
  image_url: string;
  album?: string;
  duration_ms?: number;
};

export type PlaybackSource = { id: string; name: string };
export type RepeatMode = "off" | "all" | "one";

export type PlayerState = {
  source: PlaybackSource | null;
  // The source's tracks in their original order, and in playback order (shuffled when shuffle is on)
  original: PlayerTrack[];
  order: PlayerTrack[];
  // Position of the current source track inside `order`
  index: number;
  // Tracks the user queued by hand; they play before the rest of the source, like Spotify's "Next in queue"
  upNext: PlayerTrack[];
  current: PlayerTrack | null;
  fromQueue: boolean;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  // Bumped every time a track starts (or restarts) at `startAt`, so effects can react to it
  playId: number;
  startAt: number;
};

export type PlayerAction =
  | { type: "play"; track: PlayerTrack; tracks: PlayerTrack[]; source: PlaybackSource | null }
  | { type: "toggle" }
  | { type: "next" }
  | { type: "previous"; progressMs: number }
  | { type: "trackEnded" }
  | { type: "toggleShuffle" }
  | { type: "cycleRepeat" }
  | { type: "addToQueue"; track: PlayerTrack }
  | { type: "removeFromQueue"; index: number }
  | { type: "clearQueue" }
  | { type: "playFromQueue"; index: number }
  | { type: "playFromOrder"; index: number }
  | { type: "stop" };

// Going back past this point restarts the current track instead, like Spotify
export const RESTART_THRESHOLD_MS = 3000;

export const initialPlayerState: PlayerState = {
  source: null,
  original: [],
  order: [],
  index: 0,
  upNext: [],
  current: null,
  fromQueue: false,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  playId: 0,
  startAt: 0,
};

export function shuffleTracks<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Playback order with `first` at the front, followed by the rest of the tracks
function orderStartingWith(first: PlayerTrack, tracks: PlayerTrack[], shuffle: boolean) {
  const rest = tracks.filter((track) => track.spotify_uri !== first.spotify_uri);
  return [first, ...(shuffle ? shuffleTracks(rest) : rest)];
}

function start(state: PlayerState, changes: Partial<PlayerState>): PlayerState {
  return { ...state, ...changes, isPlaying: true, playId: state.playId + 1, startAt: 0 };
}

function playOrderIndex(state: PlayerState, index: number): PlayerState {
  return start(state, { index, current: state.order[index], fromQueue: false });
}

// Moves on to the next track: queued tracks first, then the source, wrapping around on repeat
function advance(state: PlayerState): PlayerState {
  const [queued, ...upNext] = state.upNext;
  if (queued) return start(state, { current: queued, upNext, fromQueue: true });

  if (state.index + 1 < state.order.length) return playOrderIndex(state, state.index + 1);

  if (state.order.length === 0) return { ...state, isPlaying: false };

  if (state.repeat === "all") {
    const order = state.shuffle ? shuffleTracks(state.original) : state.order;
    return start(state, { order, index: 0, current: order[0], fromQueue: false });
  }

  // End of the source: stop on its first track, ready to play again
  return {
    ...state,
    index: 0,
    current: state.order[0],
    fromQueue: false,
    isPlaying: false,
    playId: state.playId + 1,
    startAt: 0,
  };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "play": {
      const original = action.tracks.length > 0 ? action.tracks : [action.track];
      const order = state.shuffle ? orderStartingWith(action.track, original, true) : original;
      const index = Math.max(
        0,
        order.findIndex((track) => track.spotify_uri === action.track.spotify_uri),
      );
      return start(state, {
        source: action.source,
        original,
        order,
        index,
        current: action.track,
        fromQueue: false,
      });
    }

    case "toggle":
      return state.current ? { ...state, isPlaying: !state.isPlaying } : state;

    case "next":
      return state.current ? advance(state) : state;

    case "trackEnded":
      if (!state.current) return state;
      if (state.repeat === "one") return start(state, {});
      return advance(state);

    case "previous": {
      if (!state.current) return state;
      if (action.progressMs > RESTART_THRESHOLD_MS) return start(state, {});
      if (state.fromQueue) return playOrderIndex(state, state.index);
      if (state.index > 0) return playOrderIndex(state, state.index - 1);
      if (state.repeat === "all" && state.order.length > 1) {
        return playOrderIndex(state, state.order.length - 1);
      }
      return start(state, {});
    }

    case "toggleShuffle": {
      const shuffle = !state.shuffle;
      const anchor = state.order[state.index];
      if (!anchor) return { ...state, shuffle };
      const order = shuffle ? orderStartingWith(anchor, state.original, true) : state.original;
      const index = Math.max(
        0,
        order.findIndex((track) => track.spotify_uri === anchor.spotify_uri),
      );
      return { ...state, shuffle, order, index };
    }

    case "cycleRepeat": {
      const next: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };
      return { ...state, repeat: next[state.repeat] };
    }

    case "addToQueue":
      // Queuing with nothing loaded just starts playing the track
      if (!state.current) {
        return start(state, {
          source: null,
          original: [action.track],
          order: [action.track],
          index: 0,
          current: action.track,
          fromQueue: false,
        });
      }
      return { ...state, upNext: [...state.upNext, action.track] };

    case "removeFromQueue":
      return { ...state, upNext: state.upNext.filter((_, i) => i !== action.index) };

    case "clearQueue":
      return { ...state, upNext: [] };

    case "playFromQueue": {
      const track = state.upNext[action.index];
      if (!track) return state;
      return start(state, {
        current: track,
        upNext: state.upNext.slice(action.index + 1),
        fromQueue: true,
      });
    }

    case "playFromOrder":
      return state.order[action.index] ? playOrderIndex(state, action.index) : state;

    case "stop":
      return { ...initialPlayerState, shuffle: state.shuffle, repeat: state.repeat };
  }
}

// What plays after the current track: the user's queue, then the rest of the source
export function upcomingFromSource(state: PlayerState): PlayerTrack[] {
  return state.order.slice(state.index + 1);
}
