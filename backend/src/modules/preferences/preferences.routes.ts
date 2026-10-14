import { Router } from "express";
import { pool } from "../../db.js";
import { requireAuth } from "../auth/auth.middleware.js";
import type { UpdatePreferencesData } from "./preferences.schemas.js";
import { updatePreferencesSchema } from "./preferences.schemas.js";
import { getGenres, getWatchProviders } from "../../services/tmdb.service.js";

export const preferencesRouter = Router();

preferencesRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
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
      [res.locals.user.id],
    );

    const preferences = result.rows[0];

    if (!preferences) {
      res.status(401).json({
        code: "SESSION_INVALID",
        message: "No hay una sesión válida.",
      });
      return;
    }

    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

async function validatePreferenceIds(
  data: UpdatePreferencesData,
): Promise<"INVALID_GENRES" | "INVALID_PROVIDERS" | null> {
  const [movieGenres, tvGenres, movieProviders, tvProviders] =
    await Promise.all([
      getGenres("movie"),
      getGenres("tv"),
      getWatchProviders("movie", data.region),
      getWatchProviders("tv", data.region),
    ]);

  const movieGenreIds = new Set(movieGenres.map((genre) => genre.id));
  const tvGenreIds = new Set(tvGenres.map((genre) => genre.id));

  if (
    data.movieGenreIds.some((id) => !movieGenreIds.has(id)) ||
    data.tvGenreIds.some((id) => !tvGenreIds.has(id))
  ) {
    return "INVALID_GENRES";
  }

  const providerIds = new Set(
    [...movieProviders, ...tvProviders].map((provider) => provider.provider_id),
  );

  if (data.providerIds.some((id) => !providerIds.has(id))) {
    return "INVALID_PROVIDERS";
  }

  return null;
}

preferencesRouter.put("/", requireAuth, async (req, res, next) => {
  const validation = updatePreferencesSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_PREFERENCES",
      message: "Revisa los datos de tus preferencias.",
    });
    return;
  }

  const data = validation.data;

  if (data.region !== res.locals.user.region) {
    res.status(409).json({
      code: "PREFERENCES_REGION_CHANGED",
      message: "Tu región cambió. Recarga las opciones antes de guardar.",
    });
    return;
  }

  try {
    const invalidIds = await validatePreferenceIds(data);

    if (invalidIds) {
      res.status(400).json({
        code: invalidIds,
        message: "Selecciona géneros y plataformas disponibles.",
      });
      return;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const account = await client.query<{ region: string }>(
        `SELECT region FROM public.users WHERE id = $1 FOR UPDATE`,
        [res.locals.user.id],
      );

      const user = account.rows[0];

      if (!user) {
        await client.query("ROLLBACK");
        res.status(401).json({
          code: "SESSION_INVALID",
          message: "No hay una sesión válida.",
        });
        return;
      }

      // La región pudo cambiar mientras consultábamos TMDB.
      if (user.region !== data.region) {
        await client.query("ROLLBACK");
        res.status(409).json({
          code: "PREFERENCES_REGION_CHANGED",
          message: "Tu región cambió. Recarga las opciones antes de guardar.",
        });
        return;
      }

      const userId = res.locals.user.id;

      await client.query(
        `INSERT INTO public.user_preferences (user_id, content_type)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET content_type = EXCLUDED.content_type`,
        [userId, data.contentType],
      );

      await client.query(
        `DELETE FROM public.preferred_genres WHERE user_id = $1`,
        [userId],
      );

      await client.query(
        `INSERT INTO public.preferred_genres
           (user_id, genre_id, media_type)
         SELECT $1::uuid, genre_id, 'movie'
         FROM unnest($2::integer[]) AS selected(genre_id)`,
        [userId, data.movieGenreIds],
      );

      await client.query(
        `INSERT INTO public.preferred_genres
           (user_id, genre_id, media_type)
         SELECT $1::uuid, genre_id, 'tv'
         FROM unnest($2::integer[]) AS selected(genre_id)`,
        [userId, data.tvGenreIds],
      );

      await client.query(
        `DELETE FROM public.preferred_providers
         WHERE user_id = $1 AND region = $2`,
        [userId, data.region],
      );

      await client.query(
        `INSERT INTO public.preferred_providers
           (user_id, provider_id, region)
         SELECT $1::uuid, provider_id, $3::text
         FROM unnest($2::integer[]) AS selected(provider_id)`,
        [userId, data.providerIds, data.region],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.json({ preferences: data });
  } catch (error) {
    next(error);
  }
});
