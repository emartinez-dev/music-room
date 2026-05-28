import Constants from "expo-constants";

const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];

export const API_URL = __DEV__
  ? `http://${debuggerHost}:8000/api`
  : "https://this-should-be-an-env-variable.com/api";
