import Constants from "expo-constants";

const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];

export const API_URL = __DEV__
  ? `http://${debuggerHost}:8000/api`
  : "https://this-should-be-an-env-variable.com/api";

export const GOOGLE_WEB_CLIENT_ID =
  "1061205683480-laa887t7u4cjasruiufuqe197hvdrh1l.apps.googleusercontent.com";