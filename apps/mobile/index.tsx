import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

if (__DEV__) {
  require("./msw.pollyfills");

  const { server } = require("@/mocks/server");
  server.listen({ onUnhandledRequest: "bypass" });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
const context = require.context("./src/app")
registerRootComponent(() => <ExpoRoot context={context} />);
