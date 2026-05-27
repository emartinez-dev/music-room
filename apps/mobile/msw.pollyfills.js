import "fast-text-encoding";
import "react-native-url-polyfill/auto";

function defineMockGlobal(name) {
  if (typeof global[name] === "undefined") {
    global[name] = class {
      constructor(type, eventInitDict) {
        this.type = type;
        Object.assign(this, eventInitDict);
      }
    };
  }
}

["MessageEvent", "Event", "EventTarget", "BroadcastChannel"].forEach(
  defineMockGlobal
);
