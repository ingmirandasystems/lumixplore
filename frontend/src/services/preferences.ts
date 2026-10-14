import { readApiError } from "./api";

export type ContentType = "movie" | "tv" | "both";

export interface Preferences {
  contentType: ContentType;
  movieGenreIds: number[];
  tvGenreIds: number[];
  providerIds: number[];
  region: string;
}

export async function getPreferences(): Promise<Preferences> {
  const response = await fetch("/api/preferences", {
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await readApiError(
      response,
      "No se pudieron cargar las preferencias",
    );
  }

  const data: { preferences: Preferences } = await response.json();
  return data.preferences;
}

export async function savePreferences(
  preferences: Preferences,
): Promise<Preferences> {
  const response = await fetch("/api/preferences", {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw await readApiError(
      response,
      "No se pudieron guardar las preferencias",
    );
  }

  const data: { preferences: Preferences } = await response.json();
  return data.preferences;
}
