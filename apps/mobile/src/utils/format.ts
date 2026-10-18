import { AxiosError } from "axios";

import { coverPalette } from "@/theme/colors";

// Stable color for a name, so a room keeps the same cover between renders
export function coverColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return coverPalette[Math.abs(hash) % coverPalette.length];
}

export function initial(name?: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) return error.response?.data?.message ?? fallback;
  return fallback;
}
