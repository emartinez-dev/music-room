import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "@/../config";
import { googleLoginApi } from "./auth";
import { saveTokens } from "./secureStore";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

export async function handleGoogleSignIn() {
  await GoogleSignin.hasPlayServices();

  await GoogleSignin.signOut();

  const { data } = await GoogleSignin.signIn();

  if (!data?.idToken) {
    throw new Error("Google Sign-In did not return an idToken");
  }

  const tokens = await googleLoginApi(data.idToken);

  saveTokens(tokens.access, tokens.refresh);

  return tokens;
}