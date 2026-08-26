# Google Keystore Guide

Ensures shared debug signing config so every developer uses the same SHA-1 fingerprint for Google Sign-In.

## 1. Shared Debug Keystore

**File:** `apps/mobile/plugins/withDebugSigningConfig.js`

- Looks for `apps/mobile/google-debug.keystore` (not in repo)
- If found, replaces the default `signingConfigs.debug` in `android/app/build.gradle`
- Credentials:
  - storePassword: `musicroom`
  - keyAlias: `googledebug`
  - keyPassword: `musicroom`

```diff
debug {
-   storeFile file('debug.keystore')
-   storePassword 'android'
-   keyAlias 'androiddebugkey'
-   keyPassword 'android'
+   storeFile file('../../google-debug.keystore')
+   storePassword 'musicroom'
+   keyAlias 'googledebug'
+   keyPassword 'musicroom'
}
```

## 2. Register the SHA-1 Fingerprint

Extract the SHA-1 from the shared keystore and register it in Google Cloud Console:

```bash
keytool -list -v -keystore apps/mobile/google-debug.keystore -alias googledebug
# Password: musicroom
```

Add the SHA-1 to your Android OAuth client in [Google Cloud Console](https://console.cloud.google.com/).

## 3. Build Integration

The plugin runs automatically during `expo prebuild`:

1. `npx expo prebuild --clean`
2. `withDebugSigningConfig.js` checks if `google-debug.keystore` exists
3. If yes → rewrites `build.gradle` signing config
4. Android build uses unified SHA-1 across all devs

## 4. Google Sign-In Configuration

**File:** `app.json` → `plugins`:
```json
"@react-native-google-signin/google-signin"
```

**File:** `src/services/googleAuth.ts`:
```ts
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});
```

## 5. Production Note

For EAS builds, add `google-debug.keystore` to your EAS build secrets:
```bash
eas build --platform android --profile preview
```

Ensure the keystore is not committed to the repo.