import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  initialPlayerState,
  type PlaybackSource,
  type PlayerTrack,
  playerReducer,
  type RepeatMode,
  upcomingFromSource,
} from "./playerQueue";

export type { PlaybackSource, PlayerTrack, RepeatMode } from "./playerQueue";

// UI-only playback: it drives the mini player, Now Playing and the queue, but plays no audio

const DEFAULT_DURATION_MS = 3 * 60 * 1000;
const TICK_MS = 1000;

type PlayerContextType = {
  current: PlayerTrack | null;
  source: PlaybackSource | null;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  upNext: PlayerTrack[];
  upcoming: PlayerTrack[];
  play: (track: PlayerTrack, tracks?: PlayerTrack[], source?: PlaybackSource) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playFromQueue: (index: number) => void;
  playUpcoming: (index: number) => void;
  stop: () => void;
};

type PlayerProgressType = { progressMs: number; durationMs: number };

const PlayerContext = createContext<PlayerContextType | null>(null);
// Progress ticks every second, so it lives in its own context to avoid re-rendering every consumer
const PlayerProgressContext = createContext<PlayerProgressType>({
  progressMs: 0,
  durationMs: DEFAULT_DURATION_MS,
});

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  // Progress is tagged with the playId it belongs to: right after a track changes, the previous
  // track's progress is still in state for one render and must not count as the new one ending
  const [tracked, setTracked] = useState({ playId: 0, ms: 0 });
  const progressMs = tracked.ms;
  const progressRef = useRef(0);
  progressRef.current = progressMs;
  const stateRef = useRef(state);
  stateRef.current = state;
  const endedPlayId = useRef(-1);

  const { current, isPlaying, playId, startAt } = state;
  const durationMs = current?.duration_ms || DEFAULT_DURATION_MS;

  // Every new playId means a track (re)started at `startAt`
  useEffect(() => {
    setTracked({ playId, ms: startAt });
    progressRef.current = startAt;
  }, [playId, startAt]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(
      () => setTracked((previous) => ({ ...previous, ms: previous.ms + TICK_MS })),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    if (
      isPlaying &&
      tracked.playId === playId &&
      tracked.ms >= durationMs &&
      endedPlayId.current !== playId
    ) {
      endedPlayId.current = playId;
      dispatch({ type: "trackEnded" });
    }
  }, [isPlaying, tracked, durationMs, playId]);

  const actions = useMemo(
    () => ({
      play: (track: PlayerTrack, tracks: PlayerTrack[] = [], source?: PlaybackSource) =>
        dispatch({ type: "play", track, tracks, source: source ?? null }),
      toggle: () => dispatch({ type: "toggle" }),
      next: () => dispatch({ type: "next" }),
      previous: () => dispatch({ type: "previous", progressMs: progressRef.current }),
      toggleShuffle: () => dispatch({ type: "toggleShuffle" }),
      cycleRepeat: () => dispatch({ type: "cycleRepeat" }),
      addToQueue: (track: PlayerTrack) => dispatch({ type: "addToQueue", track }),
      removeFromQueue: (index: number) => dispatch({ type: "removeFromQueue", index }),
      clearQueue: () => dispatch({ type: "clearQueue" }),
      playFromQueue: (index: number) => dispatch({ type: "playFromQueue", index }),
      // `index` is relative to `upcoming`, the source tracks after the current one
      playUpcoming: (index: number) =>
        dispatch({ type: "playFromOrder", index: stateRef.current.index + 1 + index }),
      stop: () => dispatch({ type: "stop" }),
    }),
    [],
  );

  const value = useMemo(
    () => ({
      current: state.current,
      source: state.source,
      isPlaying: state.isPlaying,
      shuffle: state.shuffle,
      repeat: state.repeat,
      upNext: state.upNext,
      upcoming: upcomingFromSource(state),
      ...actions,
    }),
    [state, actions],
  );
  const progress = useMemo(() => ({ progressMs, durationMs }), [progressMs, durationMs]);

  return (
    <PlayerContext.Provider value={value}>
      <PlayerProgressContext.Provider value={progress}>{children}</PlayerProgressContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within a PlayerProvider");
  return context;
}

export const usePlayerProgress = () => useContext(PlayerProgressContext);
