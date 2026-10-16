import { readApiError } from "./api";
import type { MediaType } from "./titles";

export const moodIds = [
  "laugh",
  "feel",
  "tension",
  "adrenaline",
  "escape",
  "intense",
] as const;

export type Mood = (typeof moodIds)[number];

export interface MoodTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
}

export interface MoodSection {
  id: string;
  items: MoodTitle[];
}

export interface MoodResponse {
  mood: Mood;
  region: string;
  contentType: "movie" | "tv" | "both";
  sections: MoodSection[];
}

export function isMood(value: string | undefined): value is Mood {
  return moodIds.some((mood) => mood === value);
}

export async function getMood(
  mood: Mood,
  language: "es" | "en",
  signal?: AbortSignal,
): Promise<MoodResponse> {
  const parameters = new URLSearchParams({ language });

  const response = await fetch(`/api/moods/${mood}?${parameters}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw await readApiError(
      response,
      "No se pudo cargar la experiencia seleccionada",
    );
  }

  return response.json();
}
