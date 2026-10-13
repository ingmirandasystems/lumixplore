import { readApiError } from "./api";

export interface WatchRegion {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export async function getWatchRegions(): Promise<WatchRegion[]> {
  const response = await fetch("/api/catalog/regions");

  if (!response.ok) {
    throw await readApiError(response, "No se pudieron cargar las regiones");
  }

  const data: { regions: WatchRegion[] } = await response.json();
  return data.regions;
}
