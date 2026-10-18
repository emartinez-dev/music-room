import { useState } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

type TouchableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
};

// NativeWind's JSX transform drops Pressable's function-style `style={({ pressed }) => ...}`,
// so press feedback is tracked in state and only plain style objects are passed down
export function Touchable({ style, pressedStyle, onPressIn, onPressOut, ...rest }: TouchableProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...rest}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[style, pressed && pressedStyle]}
    />
  );
}
