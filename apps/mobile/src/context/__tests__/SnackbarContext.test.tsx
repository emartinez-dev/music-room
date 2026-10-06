import { fireEvent, render, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { SnackbarProvider, useSnackbar } from "../SnackbarContext";

function Consumer({ message }: { message: string }) {
  const { showSnackbar } = useSnackbar();

  return (
    <Pressable onPress={() => showSnackbar(message)}>
      <Text>Trigger</Text>
    </Pressable>
  );
}

describe("SnackbarContext", () => {
  it("should not show anything until a message is requested", async () => {
    await render(
      <SnackbarProvider>
        <Consumer message="Saved" />
      </SnackbarProvider>,
    );

    expect(screen.queryByText("Saved")).toBeNull();
  });

  it("should show the message passed to showSnackbar", async () => {
    await render(
      <SnackbarProvider>
        <Consumer message="Login failed" />
      </SnackbarProvider>,
    );

    await fireEvent.press(screen.getByText("Trigger"));

    expect(screen.getByText("Login failed")).toBeTruthy();
  });

  it("should keep rendering its children", async () => {
    await render(
      <SnackbarProvider>
        <Consumer message="Saved" />
      </SnackbarProvider>,
    );

    expect(screen.getByText("Trigger")).toBeTruthy();
  });

  it("should hide the message when the snackbar is dismissed", async () => {
    await render(
      <SnackbarProvider>
        <Consumer message="Login failed" />
      </SnackbarProvider>,
    );

    await fireEvent.press(screen.getByText("Trigger"));
    await fireEvent.press(screen.getByTestId("snackbar-dismiss"));

    expect(screen.queryByText("Login failed")).toBeNull();
  });

  it("should hide the message when its icon is pressed", async () => {
    await render(
      <SnackbarProvider>
        <Consumer message="Login failed" />
      </SnackbarProvider>,
    );

    await fireEvent.press(screen.getByText("Trigger"));
    await fireEvent.press(screen.getByTestId("snackbar-icon"));

    expect(screen.queryByText("Login failed")).toBeNull();
  });

  // Screens call useSnackbar() unconditionally, so a missing provider must not
  // crash the app.
  it("should fall back to a no-op when used without a provider", async () => {
    await render(<Consumer message="Saved" />);

    expect(() => fireEvent.press(screen.getByText("Trigger"))).not.toThrow();
  });
});
