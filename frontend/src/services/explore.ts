import { readApiError } from "./api";

export interface ExploreTitle {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseDate: string | null;
  genres: { id: number; name: string }[];
}

export interface ExploreSection {
  mediaType: "movie" | "tv";
  page: number;
  totalPages: number;
  totalResults: number;
  items: ExploreTitle[];
}

export interface ExploreResponse {
  region: string;
  contentType: "movie" | "tv" | "both";
  sections: ExploreSection[];
}

export async function getExplore(
  language: "es" | "en",
  page = 1,
): Promise<ExploreResponse> {
  const response = await fetch(
    `/api/explore?language=${language}&page=${page}`,
    {
      credentials: "same-origin",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw await readApiError(response, "No se pudieron cargar los títulos");
  }

  return response.json();
}
