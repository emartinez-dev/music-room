import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { Avatar } from "../Avatar";
import { Touchable } from "../Touchable";

describe("Touchable", () => {
  it("should apply the pressed style only while pressed", async () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    await render(
      <Touchable
        accessibilityRole="button"
        style={{ opacity: 1 }}
        pressedStyle={{ opacity: 0.5 }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Text>Tap</Text>
      </Touchable>,
    );
    const opacity = () => StyleSheet.flatten(screen.getByRole("button").props.style).opacity;

    expect(opacity()).toBe(1);

    await fireEvent(screen.getByRole("button"), "pressIn");
    expect(opacity()).toBe(0.5);
    expect(onPressIn).toHaveBeenCalledTimes(1);

    await fireEvent(screen.getByRole("button"), "pressOut");
    expect(opacity()).toBe(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });
});

describe("Avatar", () => {
  it("should show the first letter of the name", async () => {
    await render(<Avatar name="alice" />);

    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.queryByLabelText("Open profile")).toBeNull();
  });

  it("should show a placeholder without a name", async () => {
    await render(<Avatar />);

    expect(screen.getByText("?")).toBeTruthy();
  });

  it("should be pressable when given an onPress", async () => {
    const onPress = jest.fn();
    await render(<Avatar name="alice" onPress={onPress} />);

    await fireEvent.press(screen.getByLabelText("Open profile"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
