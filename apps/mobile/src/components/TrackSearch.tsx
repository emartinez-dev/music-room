import { AxiosError } from "axios";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { ActivityIndicator, Text, TextInput } from "react-native-paper";

import { useSnackbar } from "@/context/SnackbarContext";
import { searchTracksApi } from "@/services/tracks";

type TrackSearchResult = {
  spotify_uri: string;
  name: string;
  artist: string;
  album: string;
  duration_ms: number;
  image_url: string;
};

const MAX_RESULTS = 5;

type TrackSearchProps = {
  onSelectTrack?: (spotifyUri: string) => void;
};

export function TrackSearch({ onSelectTrack }: TrackSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrackSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const tracks = await searchTracksApi(query);
      setResults(tracks.slice(0, MAX_RESULTS));
    } catch (error) {
      if (error instanceof AxiosError) {
        showSnackbar(error.response?.data?.message ?? "Track search failed");
      } else {
        showSnackbar("Track search failed");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (track: TrackSearchResult) => {
    onSelectTrack?.(track.spotify_uri);
    setResults([]);
    setQuery("");
  };

  return (
    <View>
      <TextInput
        label="Search a track"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        mode="outlined"
        returnKeyType="search"
        left={<TextInput.Icon icon="magnify" onPress={handleSearch} />}
      />
      {isSearching && <ActivityIndicator style={{ marginTop: 8 }} />}
      {results.length > 0 && (
        <View className="border border-gray-300 rounded mt-1">
          {results.map((track) => (
            <Pressable
              key={track.spotify_uri}
              onPress={() => handleSelect(track)}
              className="flex-row items-center gap-2 p-2"
            >
              <Image source={{ uri: track.image_url }} style={{ width: 32, height: 32 }} />
              <View className="flex-1">
                <Text numberOfLines={1}>{track.name}</Text>
                <Text numberOfLines={1} variant="bodySmall">
                  {track.artist}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
