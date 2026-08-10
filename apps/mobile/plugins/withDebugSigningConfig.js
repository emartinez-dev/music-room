const { withAppBuildGradle } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Shared debug keystore so every developer's SHA-1 matches the Android
// OAuth client registered in Google Cloud Console. Get the file from the
// team (not committed to the repo) and drop it at apps/mobile/google-debug.keystore.
const KEYSTORE_FILENAME = "google-debug.keystore";
const STORE_PASSWORD = "musicroom";
const KEY_ALIAS = "googledebug";
const KEY_PASSWORD = "musicroom";

const DEFAULT_DEBUG_SIGNING_CONFIG = new RegExp(
  [
    "debug\\s*\\{",
    "\\s*storeFile file\\('debug\\.keystore'\\)",
    "\\s*storePassword 'android'",
    "\\s*keyAlias 'androiddebugkey'",
    "\\s*keyPassword 'android'",
    "\\s*\\}",
  ].join(""),
);

const MISSING_KEYSTORE_WARNING = [
  `[withDebugSigningConfig] Could not find ${KEYSTORE_FILENAME} in apps/mobile.`,
  "Ask the team for the file and place it there so Google Sign-In works in debug.",
  "Falling back to the default debug keystore for now.",
].join(" ");

const UNMATCHED_BLOCK_WARNING = [
  "[withDebugSigningConfig] Could not find the expected signingConfigs.debug block in build.gradle",
  ", the shared keystore was not applied.",
].join(" ");

function buildSharedDebugSigningConfig() {
  return [
    "debug {",
    `            storeFile file('../../${KEYSTORE_FILENAME}')`,
    `            storePassword '${STORE_PASSWORD}'`,
    `            keyAlias '${KEY_ALIAS}'`,
    `            keyPassword '${KEY_PASSWORD}'`,
    "        }",
  ].join("\n");
}

module.exports = function withDebugSigningConfig(config) {
  return withAppBuildGradle(config, (config) => {
    const keystorePath = path.join(
      config.modRequest.projectRoot,
      KEYSTORE_FILENAME,
    );

    if (!fs.existsSync(keystorePath)) {
      console.warn(MISSING_KEYSTORE_WARNING);
      return config;
    }

    const contents = config.modResults.contents;

    // `expo prebuild` without --clean reuses the existing android/ directory,
    // so this mod runs again against a build.gradle that's already patched
    // from a previous run rather than the pristine template.
    if (contents.includes(`storeFile file('../../${KEYSTORE_FILENAME}')`)) {
      return config;
    }

    if (!DEFAULT_DEBUG_SIGNING_CONFIG.test(contents)) {
      console.warn(UNMATCHED_BLOCK_WARNING);
      return config;
    }

    config.modResults.contents = contents.replace(
      DEFAULT_DEBUG_SIGNING_CONFIG,
      buildSharedDebugSigningConfig(),
    );

    return config;
  });
};
