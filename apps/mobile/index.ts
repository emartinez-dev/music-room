import { registerRootComponent } from "expo";

import Index from "./app/index";

if (__DEV__) {
  require("./msw.pollyfills");

  const { server } = require("./mocks/server");
  server.listen({ onUnhandledRequest: "warn" });
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Index);
