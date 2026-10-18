import { render, screen } from "@testing-library/react-native";
import {
  Animated,
  PanResponder,
  type PanResponderCallbacks,
  type PanResponderGestureState,
  Text,
} from "react-native";

import { SwipeTrackSwitcher } from "../SwipeTrackSwitcher";

// The real responder reads raw touch history, so the test drives the gesture callbacks directly
let callbacks: PanResponderCallbacks;
const createResponder = PanResponder.create;

const gesture = (dx: number, dy = 0, vx = 0) => ({ dx, dy, vx }) as PanResponderGestureState;
const event = {} as Parameters<NonNullable<PanResponderCallbacks["onPanResponderMove"]>>[0];

describe("SwipeTrackSwitcher", () => {
  const onNext = jest.fn();
  const onPrevious = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(PanResponder, "create").mockImplementation((config) => {
      callbacks = config;
      return createResponder(config);
    });
    // Run animations to completion straight away
    const instant = { start: (done?: Animated.EndCallback) => done?.({ finished: true }) };
    jest.spyOn(Animated, "timing").mockReturnValue(instant as Animated.CompositeAnimation);
    jest.spyOn(Animated, "spring").mockReturnValue(instant as Animated.CompositeAnimation);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function renderSwitcher() {
    await render(
      <SwipeTrackSwitcher onNext={onNext} onPrevious={onPrevious}>
        <Text>Song</Text>
      </SwipeTrackSwitcher>,
    );
  }

  it("should render its children", async () => {
    await renderSwitcher();

    expect(screen.getByText("Song")).toBeTruthy();
  });

  it("should only claim sideways drags, so taps and vertical scrolls still work", async () => {
    await renderSwitcher();
    const claims = callbacks.onMoveShouldSetPanResponder;

    expect(claims?.(event, gesture(5))).toBe(false);
    expect(claims?.(event, gesture(30, 40))).toBe(false);
    expect(claims?.(event, gesture(30, 2))).toBe(true);
    expect(callbacks.onPanResponderTerminationRequest?.(event, gesture(0))).toBe(false);
  });

  it("should go to the next track when swiped left", async () => {
    await renderSwitcher();

    callbacks.onPanResponderMove?.(event, gesture(-100));
    callbacks.onPanResponderRelease?.(event, gesture(-100));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it("should go to the previous track when swiped right", async () => {
    await renderSwitcher();

    callbacks.onPanResponderRelease?.(event, gesture(100));

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("should switch on a quick flick even if it was short", async () => {
    await renderSwitcher();

    callbacks.onPanResponderRelease?.(event, gesture(-20, 0, -1));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("should spring back without switching on a short, slow drag", async () => {
    await renderSwitcher();

    callbacks.onPanResponderRelease?.(event, gesture(30));
    callbacks.onPanResponderTerminate?.(event, gesture(0));

    expect(onNext).not.toHaveBeenCalled();
    expect(onPrevious).not.toHaveBeenCalled();
    expect(Animated.spring).toHaveBeenCalledTimes(2);
  });
});
