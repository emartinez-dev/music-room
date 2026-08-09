/* eslint-env jest */

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      hostUri: "localhost:8081",
    },
  },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  get modelName() {
    return "Test Device";
  },
}));

// Silence the act() warnings from react-native-reanimated / nativewind
jest.mock("nativewind", () => {
  const React = require("react");
  return {
    styled: (Component) => Component,
    cssInterop: () => {},
  };
});

// Silence console.error output for expected errors in tests
global.console = {
  ...global.console,
  error: jest.fn(),
};

/**
 * Mock react-native-paper so its TextInput sets accessibilityLabel from the
 * label prop, making it findable by @testing-library/react-native's
 * getByLabelText().
 *
 * We use a factory function that wraps the real react-native-paper components
 * rather than a manual mock, because manual mocks loaded via jest.mock() seem
 * to cause issues when jest.clearAllMocks() runs between tests.
 */
jest.mock("react-native-paper", () => {
  const React = require("react");
  const paper = jest.requireActual("react-native-paper");
  const OrigTextInput = paper.TextInput;

  const PatchedTextInput = (props) => {
    return React.createElement(OrigTextInput, {
      ...props,
      accessibilityLabel: props.label || props.accessibilityLabel,
    });
  };

  // Copy static properties (TextInput.Icon, etc.)
  Object.getOwnPropertyNames(OrigTextInput).forEach((key) => {
    if (key !== "prototype" && key !== "name") {
      try { PatchedTextInput[key] = OrigTextInput[key]; } catch (_) {}
    }
  });
  const symbols = Object.getOwnPropertySymbols(OrigTextInput);
  symbols.forEach((sym) => {
    try { PatchedTextInput[sym] = OrigTextInput[sym]; } catch (_) {}
  });

  return {
    ...paper,
    TextInput: PatchedTextInput,
  };
});

/**
 * Mock react-native-paper to make its TextInput testable with getByLabelText.
 *
 * react-native-paper's <TextInput label="Email"> renders a visual label but
 * does NOT set accessibilityLabel on the underlying native TextInput.
 * @testing-library/react-native's getByLabelText() relies on
 * accessibilityLabel and therefore cannot locate paper inputs by their label.
 *
 * This mock bridges the gap by forwarding label → accessibilityLabel so
 * tests can use getByLabelText("Email") without modifying production code.
 *
 * The actual implementation lives in __mocks__/react-native-paper.js as a
 * manual mock file. Calling jest.mock() without a factory tells Jest to
 * use that file, avoiding hoisting issues with inline factory functions.
 */
jest.mock("react-native-paper");