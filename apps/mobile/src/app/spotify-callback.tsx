import { router } from "expo-router";
import { useEffect } from "react";

export default function SpotifyCallback() {
  useEffect(() => {
    router.dismissAll();
  }, []);

  return null;
}
