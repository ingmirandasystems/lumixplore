import { pool } from "../../db.js";
import {
  getTitleDetails,
  TmdbError,
  type CatalogLanguage,
  type MediaType,
} from "../../services/tmdb.service.js";

interface WatchlistRow {
  tmdbId: number;
  mediaType: MediaType;
}

export async function getUserWatchlist(
  userId: string,
  language: CatalogLanguage,
  page: number,
) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const countResult = await pool.query<{ total: string }>(
    `SELECT count(*) AS total
     FROM public.watchlist_items
     WHERE user_id = $1`,
    [userId],
  );

  const totalResults = Number(countResult.rows[0]!.total);

  const result = await pool.query<WatchlistRow>(
    `SELECT
       tmdb_id AS "tmdbId",
       media_type AS "mediaType"
     FROM public.watchlist_items
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset],
  );

  const items = await Promise.all(
    result.rows.map(async (item) => {
      try {
        const details = await getTitleDetails(
          item.mediaType,
          item.tmdbId,
          language,
        );

        return {
          id: item.tmdbId,
          mediaType: item.mediaType,
          title:
            details.title ||
            details.name ||
            details.original_title ||
            details.original_name ||
            String(item.tmdbId),
          posterPath: details.poster_path,
          available: true,
        };
      } catch (error) {
        if (error instanceof TmdbError && error.status === 404) {
          return {
            id: item.tmdbId,
            mediaType: item.mediaType,
            title: null,
            posterPath: null,
            available: false,
          };
        }

        throw error;
      }
    }),
  );

  return {
    page,
    totalPages: Math.ceil(totalResults / pageSize),
    totalResults,
    items,
  };
}
