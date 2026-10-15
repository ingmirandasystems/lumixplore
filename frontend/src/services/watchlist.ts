import { readApiError } from "./api";
import type { MediaType } from "./titles";

export interface WatchlistStatus {
  inWatchlist: boolean;
}

export async function getWatchlistStatus(
  mediaType: MediaType,
  tmdbId: number,
  signal?: AbortSignal,
): Promise<WatchlistStatus> {
  const response = await fetch(`/api/watchlist/${mediaType}/${tmdbId}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw await readApiError(
      response,
      "No se pudo comprobar si el título está en tu lista",
    );
  }

  return response.json();
}

export async function setWatchlistStatus(
  mediaType: MediaType,
  tmdbId: number,
  inWatchlist: boolean,
): Promise<WatchlistStatus> {
  const response = await fetch(`/api/watchlist/${mediaType}/${tmdbId}`, {
    method: inWatchlist ? "PUT" : "DELETE",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw await readApiError(response, "No se pudo actualizar tu lista");
  }

  return response.json();
}

export interface WatchlistItem {
  id: number;
  mediaType: MediaType;
  title: string | null;
  posterPath: string | null;
  available: boolean;
}

export interface WatchlistResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  items: WatchlistItem[];
}

export async function getWatchlist(
  language: "es" | "en",
  page = 1,
  signal?: AbortSignal,
): Promise<WatchlistResponse> {
  const response = await fetch(
    `/api/watchlist?language=${language}&page=${page}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw await readApiError(response, "No se pudo cargar tu lista");
  }

  return response.json();
}
