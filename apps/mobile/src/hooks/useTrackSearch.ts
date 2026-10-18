import { useEffect, useState } from "react";

import { useSnackbar } from "@/context/SnackbarContext";
import { searchTracksApi, type TrackSearchResult } from "@/services/tracks";
import { errorMessage } from "@/utils/format";

const DEBOUNCE_MS = 400;

// Searches as the user types, like Spotify, ignoring responses for stale queries
export function useTrackSearch(query: string) {
  const [results, setResults] = useState<TrackSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const tracks = await searchTracksApi(trimmed);
        if (!cancelled) setResults(tracks);
      } catch (error) {
        if (!cancelled) showSnackbar(errorMessage(error, "Track search failed"));
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, showSnackbar]);

  return { results, isSearching };
}
