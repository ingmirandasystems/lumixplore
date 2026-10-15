export type MediaType = "movie" | "tv";
export type CatalogLanguage = "es" | "en";

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
}

export interface TmdbTitleSummary {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  genre_ids: number[];
  release_date?: string;
  first_air_date?: string;
}

export interface TmdbDiscoverResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbTitleSummary[];
}

interface DiscoverTitlesOptions {
  mediaType: MediaType;
  language: CatalogLanguage;
  page: number;
  region: string;
  genreIds: number[];
  providerIds: number[];
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export class TmdbError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`TMDB respondió con estado ${status}`);
    this.name = "TmdbError";
    this.status = status;
  }
}

async function getCachedTmdb<T>(
  path: string,
  parameters: Record<string, string>,
): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);

  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }

  cache.delete(cacheKey);

  const pending = pendingRequests.get(cacheKey);

  if (pending) {
    return (await pending) as T;
  }

  const request = (async (): Promise<T> => {
    const token = process.env.TMDB_ACCESS_TOKEN;

    if (!token) {
      throw new Error("Falta configurar TMDB_ACCESS_TOKEN");
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new TmdbError(response.status);
    }

    const data: T = await response.json();

    cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + CACHE_DURATION,
    });

    return data;
  })();

  pendingRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

export async function getWatchRegions(): Promise<WatchRegion[]> {
  const data = await getCachedTmdb<{ results: WatchRegion[] }>(
    "watch/providers/regions",
    { language: "en-US" },
  );

  return data.results;
}

export async function getGenres(
  mediaType: MediaType,
  language: CatalogLanguage = "en",
): Promise<Genre[]> {
  const data = await getCachedTmdb<{ genres: Genre[] }>(
    `genre/${mediaType}/list`,
    { language: language === "es" ? "es-MX" : "en-US" },
  );

  return data.genres;
}

export async function getWatchProviders(
  mediaType: MediaType,
  region: string,
  language: CatalogLanguage = "en",
): Promise<WatchProvider[]> {
  const data = await getCachedTmdb<{ results: WatchProvider[] }>(
    `watch/providers/${mediaType}`,
    {
      watch_region: region,
      language: language === "es" ? "es-MX" : "en-US",
    },
  );

  return data.results;
}

export async function discoverTitles({
  mediaType,
  language,
  page,
  region,
  genreIds,
  providerIds,
}: DiscoverTitlesOptions): Promise<TmdbDiscoverResponse> {
  const parameters: Record<string, string> = {
    language: language === "es" ? "es-MX" : "en-US",
    page: String(page),
    sort_by: "popularity.desc",
    include_adult: "false",
  };

  if (genreIds.length > 0) {
    parameters.with_genres = genreIds.join("|");
  }

  if (providerIds.length > 0) {
    parameters.watch_region = region;
    parameters.with_watch_providers = providerIds.join("|");
    parameters.with_watch_monetization_types = "flatrate";
  }

  return getCachedTmdb<TmdbDiscoverResponse>(
    `discover/${mediaType}`,
    parameters,
  );
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
}

export interface TmdbTitleDetails {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  tagline: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  last_air_date?: string;
  genres: Genre[];
  runtime?: number | null;
  episode_run_time?: number[];

  status: string;
  original_language: string;
  vote_average: number;
  vote_count: number;

  budget?: number;
  revenue?: number;

  number_of_seasons?: number;
  number_of_episodes?: number;
  in_production?: boolean;

  production_companies: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];

  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];

  spoken_languages: {
    iso_639_1: string;
    english_name: string;
    name: string;
  }[];

  created_by?: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];

  networks?: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
}

export interface TmdbFullTitleDetails extends TmdbTitleDetails {
  credits: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };

  videos: {
    results: TmdbVideo[];
  };

  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: {
        certification: string;
        type: number;
        release_date: string;
      }[];
    }[];
  };

  content_ratings?: {
    results: {
      iso_3166_1: string;
      rating: string;
    }[];
  };
}

export async function getTitleDetails(
  mediaType: MediaType,
  tmdbId: number,
  language: CatalogLanguage = "en",
): Promise<TmdbTitleDetails> {
  return getCachedTmdb<TmdbTitleDetails>(`${mediaType}/${tmdbId}`, {
    language: language === "es" ? "es-MX" : "en-US",
  });
}

export async function getFullTitleDetails(
  mediaType: MediaType,
  tmdbId: number,
  language: CatalogLanguage = "en",
): Promise<TmdbFullTitleDetails> {
  return getCachedTmdb<TmdbFullTitleDetails>(`${mediaType}/${tmdbId}`, {
    language: language === "es" ? "es-MX" : "en-US",
    append_to_response:
      mediaType === "movie"
        ? "credits,videos,release_dates"
        : "credits,videos,content_ratings",
    include_video_language: `${language},en,null`,
  });
}

export interface TmdbWatchAvailability {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
}

interface TmdbTitleProvidersResponse {
  id: number;
  results: Record<string, TmdbWatchAvailability>;
}

export async function getTitleWatchAvailability(
  mediaType: MediaType,
  tmdbId: number,
  region: string,
): Promise<TmdbWatchAvailability | null> {
  const data = await getCachedTmdb<TmdbTitleProvidersResponse>(
    `${mediaType}/${tmdbId}/watch/providers`,
    {},
  );

  return data.results[region] ?? null;
}

export async function getSimilarTitles(
  mediaType: MediaType,
  tmdbId: number,
  language: CatalogLanguage = "en",
  page = 1,
): Promise<TmdbDiscoverResponse> {
  return getCachedTmdb<TmdbDiscoverResponse>(`${mediaType}/${tmdbId}/similar`, {
    language: language === "es" ? "es-MX" : "en-US",
    page: String(page),
  });
}
