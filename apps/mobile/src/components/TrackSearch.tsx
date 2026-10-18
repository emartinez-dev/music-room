import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import { useTrackSearch } from "@/hooks/useTrackSearch";
import { colors } from "@/theme/colors";

import { TrackRow } from "./TrackRow";
import { SearchInput } from "./ui/SearchInput";

type TrackSearchProps = {
  onSelectTrack?: (spotifyUri: string) => void;
  // Tracks already in the room, shown with a check instead of the add button
  addedUris?: string[];
};

export function TrackSearch({ onSelectTrack, addedUris = [] }: TrackSearchProps) {
  const [query, setQuery] = useState("");
  const { results, isSearching } = useTrackSearch(query);

  return (
    <View style={styles.container}>
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search for songs"
        variant="dark"
        autoFocus
      />
      {isSearching && <ActivityIndicator color={colors.green} style={styles.loading} />}
      {!isSearching && query.trim() === "" && (
        <Text style={styles.hint}>Find songs to add to this room.</Text>
      )}
      <FlatList
        data={results}
        keyExtractor={(track) => track.spotify_uri}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const added = addedUris.includes(item.spotify_uri);
          return (
            <TrackRow
              track={item}
              action={{
                icon: added ? "checkmark-circle" : "add-circle-outline",
                label: added ? `${item.name} added` : `Add ${item.name}`,
                active: added,
              }}
              onAction={() => !added && onSelectTrack?.(item.spotify_uri)}
              onPress={() => !added && onSelectTrack?.(item.spotify_uri)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  loading: { marginTop: 16 },
  hint: { color: colors.textSubdued, textAlign: "center", marginTop: 32, fontSize: 15 },
  list: { paddingBottom: 32 },
});
