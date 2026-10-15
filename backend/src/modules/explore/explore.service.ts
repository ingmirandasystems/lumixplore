import { pool } from "../../db.js";
import type { UpdatePreferencesData } from "../preferences/preferences.schemas.js";
import {
  discoverTitles,
  getGenres,
  getTrendingTitles,
  getTitleWatchAvailability,
} from "../../services/tmdb.service.js";
import type {
  MediaType,
  TmdbTitleSummary,
} from "../../services/tmdb.service.js";
import type { ExploreQuery } from "./explore.schemas.js";

export async function getExplorePreferences(
  userId: string,
): Promise<UpdatePreferencesData | null> {
  const result = await pool.query<UpdatePreferencesData>(
    `SELECT
       COALESCE(p.content_type, 'both') AS "contentType",
       u.region,
       ARRAY(
         SELECT g.genre_id
         FROM public.preferred_genres AS g
         WHERE g.user_id = u.id AND g.media_type = 'movie'
         ORDER BY g.genre_id
       ) AS "movieGenreIds",
       ARRAY(
         SELECT g.genre_id
         FROM public.preferred_genres AS g
         WHERE g.user_id = u.id AND g.media_type = 'tv'
         ORDER BY g.genre_id
       ) AS "tvGenreIds",
       ARRAY(
         SELECT pr.provider_id
         FROM public.preferred_providers AS pr
         WHERE pr.user_id = u.id AND pr.region = u.region
         ORDER BY pr.provider_id
       ) AS "providerIds"
     FROM public.users AS u
     LEFT JOIN public.user_preferences AS p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export interface ExploreTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseDate: string | null;
  genres: { id: number; name: string }[];
}

function normalizeTitle(
  item: TmdbTitleSummary,
  mediaType: MediaType,
  genreNames: Map<number, string>,
): ExploreTitle {
  const title =
    mediaType === "movie"
      ? item.title || item.original_title
      : item.name || item.original_name;

  const releaseDate =
    mediaType === "movie" ? item.release_date : item.first_air_date;

  return {
    id: item.id,
    mediaType,
    title: title || String(item.id),
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    overview: item.overview,
    releaseDate: releaseDate || null,
    genres: item.genre_ids.map((id) => ({
      id,
      name: genreNames.get(id) ?? String(id),
    })),
  };
}

export interface ExploreSection {
  id: string;
  kind: "popular" | "topRated" | "trending";
  mediaType: MediaType;
  page: number;
  totalPages: number;
  totalResults: number;
  items: ExploreTitle[];
}

export async function getExploreSections(
  preferences: UpdatePreferencesData,
  query: ExploreQuery,
): Promise<ExploreSection[]> {
  const mediaTypes: MediaType[] =
    preferences.contentType === "both"
      ? ["movie", "tv"]
      : [preferences.contentType];

  const sectionDefinitions = mediaTypes.flatMap((mediaType) => [
    {
      mediaType,
      kind: "popular" as const,
      sortBy: "popularity.desc" as const,
      minimumVotes: 0,
    },
    {
      mediaType,
      kind: "topRated" as const,
      sortBy: "vote_average.desc" as const,
      minimumVotes: 300,
    },
  ]);

  const regularSectionsPromise = Promise.all(
    sectionDefinitions.map(async (definition) => {
      const { mediaType, kind, sortBy, minimumVotes } = definition;

      const genreIds =
        mediaType === "movie"
          ? preferences.movieGenreIds
          : preferences.tvGenreIds;

      const [titles, genres] = await Promise.all([
        discoverTitles({
          mediaType,
          language: query.language,
          page: query.page,
          region: preferences.region,
          genreIds,
          providerIds: preferences.providerIds,
          sortBy,
          minimumVotes,
        }),
        getGenres(mediaType, query.language),
      ]);

      const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));

      return {
        id: `${kind}-${mediaType}`,
        kind,
        mediaType,
        page: titles.page,
        totalPages: Math.min(titles.total_pages, 100),
        totalResults: titles.total_results,
        items: titles.results.map((item) =>
          normalizeTitle(item, mediaType, genreNames),
        ),
      };
    }),
  );

  const trendingSectionsPromise = Promise.all(
    mediaTypes.map((mediaType) =>
      getTrendingSection(mediaType, preferences, query.language),
    ),
  );

  const [trendingSections, regularSections] = await Promise.all([
    trendingSectionsPromise,
    regularSectionsPromise,
  ]);

  return [...trendingSections, ...regularSections];
}

async function getTrendingSection(
  mediaType: MediaType,
  preferences: UpdatePreferencesData,
  language: ExploreQuery["language"],
): Promise<ExploreSection> {
  const [trending, genres] = await Promise.all([
    getTrendingTitles(mediaType, language),
    getGenres(mediaType, language),
  ]);

  const selectedGenres =
    mediaType === "movie" ? preferences.movieGenreIds : preferences.tvGenreIds;

  const candidates = trending.results.filter(
    (item) =>
      selectedGenres.length === 0 ||
      item.genre_ids.some((id) => selectedGenres.includes(id)),
  );

  const matchingTitles: TmdbTitleSummary[] = [];

  // Consultamos como máximo cinco disponibilidades a la vez.
  for (let index = 0; index < candidates.length; index += 5) {
    const batch = candidates.slice(index, index + 5);

    const matches = await Promise.all(
      batch.map(async (item) => {
        if (preferences.providerIds.length === 0) {
          return item;
        }

        const availability = await getTitleWatchAvailability(
          mediaType,
          item.id,
          preferences.region,
        );

        const matchesProvider = availability?.flatrate?.some((provider) =>
          preferences.providerIds.includes(provider.provider_id),
        );

        return matchesProvider ? item : null;
      }),
    );

    for (const item of matches) {
      if (item) matchingTitles.push(item);
    }
  }

  const genreNames = new Map(genres.map((genre) => [genre.id, genre.name]));

  const items = matchingTitles
    .slice(0, 20)
    .map((item) => normalizeTitle(item, mediaType, genreNames));

  return {
    id: `trending-${mediaType}`,
    kind: "trending",
    mediaType,
    page: 1,
    totalPages: items.length > 0 ? 1 : 0,
    totalResults: items.length,
    items,
  };
}
