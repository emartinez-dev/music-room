import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";

import { useAuth } from "@/context/AuthContext";

export default function SpotifyLinkModal() {
  const { linkSpotify, isLoading } = useAuth();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLink = async () => {
    const linked = await linkSpotify();
    // On Android, the spotify-callback screen may have already dismissed this
    // modal (dismissAll()) by the time this resolves, racing with the navigation
    // below — skip it if that already happened.
    if (linked && isMounted.current && router.canGoBack()) router.back();
  };

  return (
    <View className="flex-1 items-center justify-center gap-4 p-4">
      <IconButton
        icon="close"
        style={{ position: "absolute", top: 8, right: 8 }}
        onPress={() => router.back()}
      />
      <Text variant="titleMedium" style={{ textAlign: "center" }}>
        Link your Spotify account to vote and edit playlists
      </Text>
      <Button
        mode="contained"
        icon="spotify"
        onPress={handleLink}
        loading={isLoading}
        disabled={isLoading}
      >
        Link your Spotify account
      </Button>
    </View>
  );
}
