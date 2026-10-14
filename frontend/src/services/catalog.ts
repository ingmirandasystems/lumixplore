import { readApiError } from "./api";

export interface WatchRegion {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
  mediaTypes: ("movie" | "tv")[];
}

export interface PreferencesOptions {
  region: string;
  genres: {
    movie: Genre[];
    tv: Genre[];
  };
  providers: WatchProvider[];
}

export async function getWatchRegions(): Promise<WatchRegion[]> {
  const response = await fetch("/api/catalog/regions");

  if (!response.ok) {
    throw await readApiError(response, "No se pudieron cargar las regiones");
  }

  const data: { regions: WatchRegion[] } = await response.json();
  return data.regions;
}

export async function getPreferencesOptions(
  language: "es" | "en",
): Promise<PreferencesOptions> {
  const response = await fetch(
    `/api/catalog/preferences-options?language=${language}`,
    {
      credentials: "same-origin",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await readApiError(
      response,
      "No se pudieron cargar las opciones de preferencias",
    );
  }

  return response.json();
}
