import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useRef } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

import { colors } from "@/theme/colors";

type SwipeToQueueProps = {
  onQueue: () => void;
  children: React.ReactNode;
};

const TRIGGER_DISTANCE = 80;
const MAX_DRAG = 120;

// Swipe a track row to the right to add it to the queue, like Spotify
export function SwipeToQueue({ onQueue, children }: SwipeToQueueProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const onQueueRef = useRef(onQueue);
  onQueueRef.current = onQueue;

  const responder = useMemo(() => {
    const springBack = () =>
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => translateX.setValue(Math.max(0, Math.min(g.dx, MAX_DRAG))),
      onPanResponderRelease: (_, g) => {
        if (g.dx > TRIGGER_DISTANCE) onQueueRef.current();
        springBack();
      },
      onPanResponderTerminate: springBack,
    });
  }, [translateX]);

  const iconOpacity = translateX.interpolate({
    inputRange: [0, TRIGGER_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const iconScale = translateX.interpolate({
    inputRange: [0, TRIGGER_DISTANCE, MAX_DRAG],
    outputRange: [0.6, 1, 1.15],
    extrapolate: "clamp",
  });

  return (
    <View>
      <Animated.View style={[styles.action, { opacity: iconOpacity }]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <MaterialCommunityIcons name="playlist-plus" size={28} color={colors.black} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        {...responder.panHandlers}
        style={[styles.row, { transform: [{ translateX }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -16,
    right: 0,
    justifyContent: "center",
    paddingLeft: 32,
    backgroundColor: colors.green,
  },
  row: { backgroundColor: colors.background },
});
