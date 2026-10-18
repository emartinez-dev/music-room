import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { SwipeToQueue } from "@/components/SwipeToQueue";
import { TrackActionsSheet } from "@/components/TrackActionsSheet";
import { TrackRow } from "@/components/TrackRow";
import { SearchInput } from "@/components/ui/SearchInput";
import { usePlayer } from "@/context/PlayerContext";
import { useSnackbar } from "@/context/SnackbarContext";
import { useTrackSearch } from "@/hooks/useTrackSearch";
import type { TrackSearchResult } from "@/services/tracks";
import { colors, TAB_BAR_SPACE } from "@/theme/colors";

const SEARCH_SOURCE = { id: "search", name: "Search results" };

// Each tile runs a search for its genre, so "Browse all" is a shortcut into real results
const BROWSE_CATEGORIES = [
  { title: "Pop", color: "#148A08", icon: "star" },
  { title: "Hip-Hop", color: "#BC5900", icon: "mic" },
  { title: "Rock", color: "#E13300", icon: "flash" },
  { title: "Latin", color: "#E1118C", icon: "sunny" },
  { title: "Indie", color: "#608108", icon: "leaf" },
  { title: "Electronic", color: "#1E3264", icon: "pulse" },
  { title: "R&B", color: "#DC148C", icon: "heart" },
  { title: "Jazz", color: "#477D95", icon: "musical-notes" },
  { title: "Chill", color: "#503750", icon: "cafe" },
  { title: "Workout", color: "#777777", icon: "barbell" },
  { title: "Party", color: "#AF2896", icon: "sparkles" },
  { title: "Classical", color: "#7D4B32", icon: "musical-note" },
] as const;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [sheetTrack, setSheetTrack] = useState<TrackSearchResult | null>(null);
  const { results, isSearching } = useTrackSearch(query);
  const { play, addToQueue } = usePlayer();
  const { showSnackbar } = useSnackbar();

  const isBrowsing = query.trim() === "";

  const queue = (track: TrackSearchResult) => {
    addToQueue(track);
    showSnackbar("Added to queue");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.top}>
        <ScreenHeader title="Search" />
        <SearchInput value={query} onChangeText={setQuery} />
      </View>

      {isBrowsing ? (
        <ScrollView contentContainerStyle={styles.browse}>
          <Text style={styles.sectionTitle}>Browse all</Text>
          <View style={styles.grid}>
            {BROWSE_CATEGORIES.map((category) => (
              <Pressable
                key={category.title}
                onPress={() => setQuery(category.title)}
                accessibilityRole="button"
                style={[styles.tile, { backgroundColor: category.color }]}
              >
                <Text style={styles.tileTitle}>{category.title}</Text>
                <View style={styles.tileArt}>
                  <Ionicons name={category.icon} size={34} color="rgba(255,255,255,0.9)" />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(track) => track.spotify_uri}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.results}
          ListHeaderComponent={
            isSearching ? <ActivityIndicator color={colors.green} style={styles.loading} /> : null
          }
          ListEmptyComponent={
            isSearching ? null : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No results found for "{query.trim()}"</Text>
                <Text style={styles.emptyText}>
                  Check the spelling, or try searching for something else.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <SwipeToQueue onQueue={() => queue(item)}>
              <TrackRow
                track={item}
                onPress={() => play(item, results, SEARCH_SOURCE)}
                onMore={() => setSheetTrack(item)}
              />
            </SwipeToQueue>
          )}
        />
      )}

      <TrackActionsSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  browse: { paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginVertical: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  tile: { width: "48.5%", height: 100, borderRadius: 6, padding: 12, overflow: "hidden" },
  tileTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  // Tilted square in the corner, standing in for Spotify's rotated album art
  tileArt: {
    position: "absolute",
    right: -14,
    bottom: -8,
    width: 64,
    height: 64,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    transform: [{ rotate: "25deg" }],
  },
  results: { paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE },
  loading: { marginVertical: 16 },
  empty: { alignItems: "center", marginTop: 64, gap: 8, paddingHorizontal: 24 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyText: { color: colors.textSubdued, fontSize: 14, textAlign: "center" },
});
