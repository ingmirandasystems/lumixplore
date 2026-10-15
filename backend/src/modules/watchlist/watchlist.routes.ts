import { Router } from "express";
import { pool } from "../../db.js";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  watchlistTitleParamsSchema,
  watchlistQuerySchema,
} from "./watchlist.schemas.js";
import { getTitleDetails, TmdbError } from "../../services/tmdb.service.js";
import { getUserWatchlist } from "./watchlist.service.js";

export const watchlistRouter = Router();

watchlistRouter.get(
  "/:mediaType/:tmdbId",
  requireAuth,
  async (req, res, next) => {
    const validation = watchlistTitleParamsSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_WATCHLIST_TITLE",
        message: "Revisa el tipo de contenido y el identificador.",
      });
      return;
    }

    try {
      const { mediaType, tmdbId } = validation.data;

      const result = await pool.query<{ inWatchlist: boolean }>(
        `SELECT EXISTS (
          SELECT 1
          FROM public.watchlist_items
          WHERE user_id = $1
            AND tmdb_id = $2
            AND media_type = $3
        ) AS "inWatchlist"`,
        [res.locals.user.id, tmdbId, mediaType],
      );

      res.json({
        inWatchlist: result.rows[0]!.inWatchlist,
      });
    } catch (error) {
      next(error);
    }
  },
);

watchlistRouter.put(
  "/:mediaType/:tmdbId",
  requireAuth,
  async (req, res, next) => {
    const validation = watchlistTitleParamsSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_WATCHLIST_TITLE",
        message: "Revisa el tipo de contenido y el identificador.",
      });
      return;
    }

    try {
      const { mediaType, tmdbId } = validation.data;

      // Comprobamos que el título exista antes de guardarlo.
      await getTitleDetails(mediaType, tmdbId);

      await pool.query(
        `INSERT INTO public.watchlist_items
          (user_id, tmdb_id, media_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, tmdb_id, media_type) DO NOTHING`,
        [res.locals.user.id, tmdbId, mediaType],
      );

      res.json({
        inWatchlist: true,
      });
    } catch (error) {
      if (error instanceof TmdbError) {
        if (error.status === 404) {
          res.status(404).json({
            code: "TITLE_NOT_FOUND",
            message: "El título solicitado no existe.",
          });
          return;
        }

        res.status(502).json({
          code: "CATALOG_UNAVAILABLE",
          message: "No se pudo comprobar el título en el catálogo.",
        });
        return;
      }

      next(error);
    }
  },
);

watchlistRouter.delete(
  "/:mediaType/:tmdbId",
  requireAuth,
  async (req, res, next) => {
    const validation = watchlistTitleParamsSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_WATCHLIST_TITLE",
        message: "Revisa el tipo de contenido y el identificador.",
      });
      return;
    }

    try {
      const { mediaType, tmdbId } = validation.data;

      await pool.query(
        `DELETE FROM public.watchlist_items
         WHERE user_id = $1
           AND tmdb_id = $2
           AND media_type = $3`,
        [res.locals.user.id, tmdbId, mediaType],
      );

      res.json({
        inWatchlist: false,
      });
    } catch (error) {
      next(error);
    }
  },
);

watchlistRouter.get("/", requireAuth, async (req, res, next) => {
  const validation = watchlistQuerySchema.safeParse(req.query);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_WATCHLIST_QUERY",
      message: "Revisa el idioma y la página solicitada.",
    });
    return;
  }

  try {
    const { language, page } = validation.data;

    const watchlist = await getUserWatchlist(
      res.locals.user.id,
      language,
      page,
    );

    res.json(watchlist);
  } catch (error) {
    if (error instanceof TmdbError) {
      res.status(502).json({
        code: "CATALOG_UNAVAILABLE",
        message: "No se pudieron consultar los títulos de tu lista.",
      });
      return;
    }

    next(error);
  }
});
