import { useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  type StyleProp,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";

type SwipeTrackSwitcherProps = {
  onNext: () => void;
  onPrevious: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const SWIPE_DISTANCE = 70;
const SWIPE_VELOCITY = 0.5;

// Swipe left for the next track, right for the previous one, like Spotify's player.
// Taps still reach the children: the gesture is only claimed once the finger moves sideways.
export function SwipeTrackSwitcher({
  onNext,
  onPrevious,
  style,
  children,
}: SwipeTrackSwitcherProps) {
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  // The responder is created once, so it reads the latest callbacks through refs
  const handlers = useRef({ onNext, onPrevious, width });
  handlers.current = { onNext, onPrevious, width };

  const responder = useMemo(() => {
    const springBack = () =>
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => translateX.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        const goNext = g.dx < -SWIPE_DISTANCE || g.vx < -SWIPE_VELOCITY;
        const goPrevious = g.dx > SWIPE_DISTANCE || g.vx > SWIPE_VELOCITY;
        if (!goNext && !goPrevious) return springBack();

        const { width: screenWidth } = handlers.current;
        const exitTo = goNext ? -screenWidth : screenWidth;
        Animated.timing(translateX, {
          toValue: exitTo,
          duration: 140,
          useNativeDriver: true,
        }).start(() => {
          if (goNext) handlers.current.onNext();
          else handlers.current.onPrevious();
          // The new track slides in from the opposite side
          translateX.setValue(-exitTo * 0.6);
          springBack();
        });
      },
      onPanResponderTerminate: springBack,
    });
  }, [translateX]);

  const opacity = translateX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [0.2, 1, 0.2],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[style, { opacity, transform: [{ translateX }] }]}
    >
      {children}
    </Animated.View>
  );
}
