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
  var safeKeys = ["value", "onChangeText", "onBlur", "onFocus", "editable",  
                   "secureTextEntry", "keyboardType", "autoCapitalize",  
                   "multiline", "disabled", "testID", "placeholder", "style"];  
  for (var key in props) {  
    if (props.hasOwnProperty(key) && safeKeys.indexOf(key) !== -1) {  
      rest[key] = props[key];  
    }  
  }  
  return React.createElement(RN.TextInput, Object.assign({}, rest, {
    accessibilityLabel: label || props.accessibilityLabel,  
    placeholder: label || props.placeholder,  
    style: [{ borderWidth: 0 }, props.style].filter(Boolean),  
  }));  
}  

// Support TextInput.Icon used in the app  
MockTextInput.Icon = function TextInputIcon(props) {  
  var React = require("react");
  var RN = require("react-native");  
  return React.createElement(RN.View, props, null);  
};  

// ── Button ─────────────────────────────────────────────────────────────────  
function MockButton(props) {  
  var React = require("react");
  var RN = require("react-native");  
  var children = props.children;  
  var safeKeys = ["disabled", "onPress", "testID", "accessible",  
                   "accessibilityRole", "accessibilityState"];  
  var rest = {};  
  for (var key in props) {  
    if (props.hasOwnProperty(key) && safeKeys.indexOf(key) !== -1) {  
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
  return React.createElement(RN.View, null, props.children);  
}  

// ── Exports ────────────────────────────────────────────────────────────────  
module.exports = {  
  TextInput: MockTextInput,  
  Button: MockButton,  
  Divider: MockDivider,  
  Snackbar: MockSnackbar,  
};  
module.exports.default = module.exports;