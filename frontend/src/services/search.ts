import { readApiError } from "./api";
import type { MediaType } from "./titles";

export interface SearchTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
}

export interface SearchSection {
  mediaType: MediaType;
  page: number;
  totalPages: number;
  totalResults: number;
  items: SearchTitle[];
}

export interface SearchResponse {
  query: string;
  page: number;
  totalPages: number;
  totalResults: number;
  sections: SearchSection[];
}

export async function searchTitles(
  query: string,
  language: "es" | "en",
  page = 1,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const parameters = new URLSearchParams({
    q: query,
    language,
    page: String(page),
  });

  const response = await fetch(`/api/search?${parameters}`, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw await readApiError(response, "No se pudo realizar la búsqueda");
  }

  return response.json();
}
