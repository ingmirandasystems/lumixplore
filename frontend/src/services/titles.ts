import { readApiError } from "./api";

export type MediaType = "movie" | "tv";

export interface TitleProvider {
  id: number;
  name: string;
  logoPath: string | null;
}

export interface TitlePerson {
  id: number;
  name: string;
  profilePath: string | null;
}

export interface CatalogTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string | null;
  overview: string;
  tagline: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  genres: {
    id: number;
    name: string;
  }[];

  certification: {
    region: string;
    label: string;
  } | null;

  runtimeMinutes: number | null;
  status: string;
  originalLanguage: string;

  rating: {
    average: number;
    count: number;
  };

  movie: {
    budget: number | null;
    revenue: number | null;
    currency: string;
  } | null;

  series: {
    seasons: number | null;
    episodes: number | null;
    inProduction: boolean | null;
    lastAirDate: string | null;
    creators: TitlePerson[];
    networks: TitleProvider[];
  } | null;

  productionCompanies: (TitleProvider & {
    country: string;
  })[];

  productionCountries: {
    code: string;
    name: string;
  }[];

  spokenLanguages: {
    code: string;
    name: string;
    englishName: string;
  }[];

  cast: (TitlePerson & {
    character: string;
  })[];

  crew: (TitlePerson & {
    job: string;
    department: string;
  })[];

  trailer: {
    youtubeKey: string;
    name: string;
    language: string;
    official: boolean;
  } | null;

  watchAvailability: {
    region: string;
    link: string | null;
    subscription: TitleProvider[];
    rent: TitleProvider[];
    buy: TitleProvider[];
    free: TitleProvider[];
    ads: TitleProvider[];
  };
}

interface CatalogTitleResponse {
  title: CatalogTitle;
}

export async function getCatalogTitle(
  mediaType: MediaType,
  tmdbId: number,
  language: "es" | "en",
  signal?: AbortSignal,
): Promise<CatalogTitle> {
  const response = await fetch(
    `/api/catalog/titles/${mediaType}/${tmdbId}?language=${language}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw await readApiError(
      response,
      "No se pudo cargar la información del título",
    );
  }

  const data: CatalogTitleResponse = await response.json();

  return data.title;
}

export interface SimilarTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
}

export interface SimilarTitlesResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  items: SimilarTitle[];
}

export async function getSimilarTitles(
  mediaType: MediaType,
  tmdbId: number,
  language: "es" | "en",
  page = 1,
  signal?: AbortSignal,
): Promise<SimilarTitlesResponse> {
  const response = await fetch(
    `/api/catalog/titles/${mediaType}/${tmdbId}/similar?language=${language}&page=${page}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw await readApiError(
      response,
      "No se pudieron cargar los títulos similares",
    );
  }

  return response.json();
}
