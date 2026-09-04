/**
 * Mock react-native-paper components for testability via
 * @testing-library/react-native queries.
 *
 * WHY THIS MOCK IS NEEDED
 * ─────────────────────────
 * react-native-paper's <TextInput label="Email"> renders a visual label
 * but does NOT set accessibilityLabel on the underlying native TextInput.
 * @testing-library/react-native's getByLabelText() relies on
 * accessibilityLabel and therefore cannot locate paper inputs by their label.
 *
 * This mock bridges the gap by forwarding label → accessibilityLabel so
 * tests can use getByLabelText("Email") without modifying production code.
 *
 * NOTE: We use lazy require() INSIDE each component function rather than at
 * the top level, so that react-native is loaded at render-time (not at
 * module-import time). This avoids the Babel hoisting restriction that
 * prevents referencing out-of-scope variables inside jest.mock factories.
 */

// ── TextInput ──────────────────────────────────────────────────────────────
function MockTextInput(props) {
  var React = require("react");
  var RN = require("react-native");
  var label = props.label;
  var rest = {};
  // Copy only the props that RN.TextInput understands
  var safeKeys = [
    "value",
    "onChangeText",
    "onBlur",
    "onFocus",
    "editable",
    "secureTextEntry",
    "keyboardType",
    "autoCapitalize",
    "multiline",
    "disabled",
    "testID",
    "placeholder",
    "style",
  ];
  for (var key in props) {
    if (Object.hasOwn(props, key) && safeKeys.indexOf(key) !== -1) {
      rest[key] = props[key];
    }
  }
  var input = React.createElement(
    RN.TextInput,
    Object.assign({}, rest, {
      accessibilityLabel: label || props.accessibilityLabel,
      placeholder: label || props.placeholder,
      style: [{ borderWidth: 0 }, props.style].filter(Boolean),
    }),
  );

  // The real TextInput renders its `left` / `right` adornments (the lock and
  // eye icons) alongside the field. They are rendered here too so that tests
  // can press the password visibility toggle.
  return React.createElement(RN.View, null, props.left || null, input, props.right || null);
}

// Support TextInput.Icon used in the app.
// Rendered as a Pressable with a testID derived from the icon name so tests can
// reach the password visibility toggles, which have no visible text.
MockTextInput.Icon = function TextInputIcon(props) {
  var React = require("react");
  var RN = require("react-native");
  return React.createElement(
    RN.Pressable,
    {
      testID: props.testID || (props.icon ? `icon-${props.icon}` : undefined),
      onPress: props.onPress,
      accessibilityRole: "button",
    },
    null,
  );
};

// ── Button ─────────────────────────────────────────────────────────────────
function MockButton(props) {
  var React = require("react");
  var RN = require("react-native");
  var children = props.children;
  var safeKeys = [
    "disabled",
    "onPress",
    "testID",
    "accessible",
    "accessibilityRole",
    "accessibilityState",
  ];
  var rest = {};
  for (var key in props) {
    if (Object.hasOwn(props, key) && safeKeys.indexOf(key) !== -1) {
      rest[key] = props[key];
    }
  }
  return React.createElement(
    RN.Pressable,
    Object.assign({}, rest, {
      disabled: props.disabled,
      onPress: props.onPress,
      accessibilityRole: "button",
      accessibilityState: { disabled: !!props.disabled },
    }),
    React.createElement(RN.Text, null, children),
  );
}

// ── Divider ────────────────────────────────────────────────────────────────
function MockDivider(props) {
  var React = require("react");
  var RN = require("react-native");
  return React.createElement(RN.View, { style: props.style });
}

// ── Snackbar ───────────────────────────────────────────────────────────────
function MockSnackbar(props) {
  if (!props.visible) return null;
  var React = require("react");
  var RN = require("react-native");
  // The real Snackbar renders its message as text, so the mock has to as well
  // for getByText() to find it. The dismiss handlers are exposed as pressables
  // because the real ones fire from a timer or a close icon.
  return React.createElement(
    RN.View,
    null,
    React.createElement(RN.Text, null, props.children),
    React.createElement(RN.Pressable, {
      testID: "snackbar-dismiss",
      onPress: props.onDismiss,
    }),
    React.createElement(RN.Pressable, {
      testID: "snackbar-icon",
      onPress: props.onIconPress,
    }),
  );
}

// ── Text ───────────────────────────────────────────────────────────────────
function MockText(props) {
  var React = require("react");
  var RN = require("react-native");
  return React.createElement(RN.Text, props, props.children);
}

// ── ActivityIndicator ────────────────────────────────────────────────────────
function MockActivityIndicator(props) {
  var React = require("react");
  var RN = require("react-native");
  return React.createElement(RN.ActivityIndicator, props);
}

// ── Exports ────────────────────────────────────────────────────────────────
module.exports = {
  TextInput: MockTextInput,
  Button: MockButton,
  Divider: MockDivider,
  Snackbar: MockSnackbar,
  Text: MockText,
  ActivityIndicator: MockActivityIndicator,
};
module.exports.default = module.exports;
