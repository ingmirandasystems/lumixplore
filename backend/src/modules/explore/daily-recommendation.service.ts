import { pool } from "../../db.js";
import type { MediaType } from "../../services/tmdb.service.js";
import { randomInt } from "node:crypto";
import { discoverTitles } from "../../services/tmdb.service.js";
import {
  getTitleDetails,
  type CatalogLanguage,
} from "../../services/tmdb.service.js";

export interface DailyRecommendationContext {
  recommendationDate: string;
  contentType: "movie" | "tv" | "both";
  tmdbId: number | null;
  mediaType: MediaType | null;
}

export async function getDailyRecommendationContext(
  userId: string,
): Promise<DailyRecommendationContext | null> {
  const result = await pool.query<DailyRecommendationContext>(
    `WITH account AS (
       SELECT
         u.id,
         COALESCE(p.content_type, 'both') AS content_type,
         (clock_timestamp() AT TIME ZONE u.timezone)::date AS local_date
       FROM public.users AS u
       LEFT JOIN public.user_preferences AS p ON p.user_id = u.id
       WHERE u.id = $1
     )
     SELECT
       to_char(a.local_date, 'YYYY-MM-DD') AS "recommendationDate",
       a.content_type AS "contentType",
       d.tmdb_id AS "tmdbId",
       d.media_type AS "mediaType"
     FROM account AS a
     LEFT JOIN public.daily_recommendations AS d
       ON d.user_id = a.id
      AND d.recommendation_date = a.local_date`,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function getPreviouslyRecommendedTitles(
  userId: string,
): Promise<Set<string>> {
  const result = await pool.query<{
    tmdb_id: number;
    media_type: MediaType;
  }>(
    `SELECT tmdb_id, media_type
     FROM public.daily_recommendations
     WHERE user_id = $1`,
    [userId],
  );

  return new Set(result.rows.map((row) => `${row.media_type}:${row.tmdb_id}`));
}

export interface DailyCandidate {
  tmdbId: number;
  mediaType: MediaType;
}

export async function pickDailyCandidate(
  context: DailyRecommendationContext,
  previouslyRecommended: Set<string>,
): Promise<DailyCandidate | null> {
  const mediaTypes: MediaType[] =
    context.contentType === "both"
      ? randomInt(2) === 0
        ? ["movie", "tv"]
        : ["tv", "movie"]
      : [context.contentType];

  for (const mediaType of mediaTypes) {
    const getPage = (page: number) =>
      discoverTitles({
        mediaType,
        language: "en",
        page,
        region: "",
        genreIds: [],
        providerIds: [],
      });

    const firstPage = await getPage(1);
    const maxPage = Math.min(firstPage.total_pages, 100);

    if (maxPage < 1) continue;

    const pages = new Set<number>();

    while (pages.size < Math.min(5, maxPage)) {
      pages.add(randomInt(1, maxPage + 1));
    }

    for (const page of pages) {
      const result = page === 1 ? firstPage : await getPage(page);

      const candidates = result.results.filter((item) => {
        const releaseDate =
          mediaType === "movie" ? item.release_date : item.first_air_date;

        return (
          item.backdrop_path &&
          item.poster_path &&
          item.overview?.trim() &&
          releaseDate &&
          releaseDate <= context.recommendationDate &&
          !previouslyRecommended.has(`${mediaType}:${item.id}`)
        );
      });

      if (candidates.length > 0) {
        const candidate = candidates[randomInt(candidates.length)]!;

        return {
          tmdbId: candidate.id,
          mediaType,
        };
      }
    }
  }

  return null;
}

export async function saveDailyCandidate(
  userId: string,
  context: DailyRecommendationContext,
  candidate: DailyCandidate,
): Promise<DailyCandidate | null> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const account = await client.query<{
      recommendationDate: string;
      contentType: "movie" | "tv" | "both";
    }>(
      `SELECT
         to_char(
           (clock_timestamp() AT TIME ZONE u.timezone)::date,
           'YYYY-MM-DD'
         ) AS "recommendationDate",
         COALESCE(p.content_type, 'both') AS "contentType"
       FROM public.users AS u
       LEFT JOIN public.user_preferences AS p ON p.user_id = u.id
       WHERE u.id = $1
       FOR UPDATE OF u`,
      [userId],
    );

    const current = account.rows[0];

    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    const existing = await client.query<DailyCandidate>(
      `SELECT tmdb_id AS "tmdbId", media_type AS "mediaType"
       FROM public.daily_recommendations
       WHERE user_id = $1 AND recommendation_date = $2::date`,
      [userId, current.recommendationDate],
    );

    if (existing.rows[0]) {
      await client.query("COMMIT");
      return existing.rows[0];
    }

    if (
      current.recommendationDate !== context.recommendationDate ||
      current.contentType !== context.contentType
    ) {
      await client.query("ROLLBACK");
      return null;
    }

    const inserted = await client.query<DailyCandidate>(
      `INSERT INTO public.daily_recommendations
         (user_id, recommendation_date, tmdb_id, media_type)
       VALUES ($1, $2::date, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING tmdb_id AS "tmdbId", media_type AS "mediaType"`,
      [
        userId,
        current.recommendationDate,
        candidate.tmdbId,
        candidate.mediaType,
      ],
    );

    await client.query("COMMIT");
    return inserted.rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrCreateDailyRecommendation(
  userId: string,
): Promise<DailyRecommendationContext | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const context = await getDailyRecommendationContext(userId);

    if (!context) {
      return null;
    }

    if (context.tmdbId !== null && context.mediaType !== null) {
      return context;
    }

    const previouslyRecommended = await getPreviouslyRecommendedTitles(userId);

    const candidate = await pickDailyCandidate(context, previouslyRecommended);

    if (!candidate) {
      break;
    }

    await saveDailyCandidate(userId, context, candidate);

    // Volvemos a consultar para obtener el registro definitivo,
    // incluso si otra solicitud lo creó o cambió el día.
  }

  const context = await getDailyRecommendationContext(userId);

  if (!context) {
    return null;
  }

  if (context.tmdbId !== null && context.mediaType !== null) {
    return context;
  }

  throw new Error("No se pudo obtener una recomendación diaria.");
}

export async function getDailyRecommendation(
  userId: string,
  language: CatalogLanguage,
) {
  const recommendation = await getOrCreateDailyRecommendation(userId);

  if (!recommendation) {
    return null;
  }

  const { tmdbId, mediaType, recommendationDate } = recommendation;

  if (tmdbId === null || mediaType === null) {
    throw new Error("La recomendación diaria está incompleta.");
  }

  const details = await getTitleDetails(mediaType, tmdbId, language);

  return {
    recommendationDate,
    title: {
      id: details.id,
      mediaType,
      title:
        details.title ??
        details.name ??
        details.original_title ??
        details.original_name ??
        String(details.id),
      overview: details.overview,
      posterPath: details.poster_path,
      backdropPath: details.backdrop_path,
      releaseDate: details.release_date ?? details.first_air_date ?? null,
      genres: details.genres,
      runtimeMinutes:
        mediaType === "movie"
          ? (details.runtime ?? null)
          : (details.episode_run_time?.[0] ?? null),
    },
  };
}
