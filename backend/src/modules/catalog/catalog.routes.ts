import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  getWatchRegions,
  getGenres,
  getWatchProviders,
  TmdbError,
  getSimilarTitles,
} from "../../services/tmdb.service.js";
import type { MediaType, WatchProvider } from "../../services/tmdb.service.js";
import { getCatalogTitle } from "./title.service.js";

export const catalogRouter = Router();

catalogRouter.get("/regions", async (_req, res, next) => {
  try {
    const regions = await getWatchRegions();

    res.json({ regions });
  } catch (error) {
    next(error);
  }
});

const preferencesOptionsQuerySchema = z.object({
  language: z.enum(["es", "en"]).default("en"),
});

const titleParamsSchema = z.object({
  mediaType: z.enum(["movie", "tv"]),
  tmdbId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .refine(Number.isSafeInteger),
});

const titleQuerySchema = z.object({
  language: z.enum(["es", "en"]).default("en"),
});

const similarTitlesQuerySchema = z.object({
  language: z.enum(["es", "en"]).default("en"),
  page: z.coerce.number().int().min(1).max(100).default(1),
});

catalogRouter.get(
  "/preferences-options",
  requireAuth,
  async (req, res, next) => {
    const validation = preferencesOptionsQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_LANGUAGE",
        message: "Selecciona un idioma válido.",
      });
      return;
    }

    try {
      const { language } = validation.data;
      const { region } = res.locals.user;

      const [movieGenres, tvGenres, movieProviders, tvProviders] =
        await Promise.all([
          getGenres("movie", language),
          getGenres("tv", language),
          getWatchProviders("movie", region, language),
          getWatchProviders("tv", region, language),
        ]);

      const providers = new Map<
        number,
        WatchProvider & { mediaTypes: MediaType[] }
      >();

      for (const [mediaType, list] of [
        ["movie", movieProviders],
        ["tv", tvProviders],
      ] as const) {
        for (const provider of list) {
          const existing = providers.get(provider.provider_id);

          if (existing) {
            existing.mediaTypes.push(mediaType);
          } else {
            providers.set(provider.provider_id, {
              ...provider,
              mediaTypes: [mediaType],
            });
          }
        }
      }

      res.json({
        region,
        genres: {
          movie: movieGenres,
          tv: tvGenres,
        },
        providers: [...providers.values()].sort(
          (a, b) =>
            a.display_priority - b.display_priority ||
            a.provider_name.localeCompare(b.provider_name, language),
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

catalogRouter.get(
  "/titles/:mediaType/:tmdbId",
  requireAuth,
  async (req, res, next) => {
    const params = titleParamsSchema.safeParse(req.params);
    const query = titleQuerySchema.safeParse(req.query);

    if (!params.success || !query.success) {
      res.status(400).json({
        code: "INVALID_TITLE_QUERY",
        message: "Revisa el tipo de contenido, el identificador y el idioma.",
      });
      return;
    }

    try {
      const { mediaType, tmdbId } = params.data;
      const { language } = query.data;

      const title = await getCatalogTitle(
        mediaType,
        tmdbId,
        language,
        res.locals.user.region,
      );

      res.json({ title });
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
          message:
            "No se pudo consultar el catálogo. Intenta de nuevo más tarde.",
        });
        return;
      }

      next(error);
    }
  },
);

catalogRouter.get(
  "/titles/:mediaType/:tmdbId/similar",
  requireAuth,
  async (req, res, next) => {
    const params = titleParamsSchema.safeParse(req.params);
    const query = similarTitlesQuerySchema.safeParse(req.query);

    if (!params.success || !query.success) {
      res.status(400).json({
        code: "INVALID_SIMILAR_TITLES_QUERY",
        message: "Revisa el título, el idioma y la página solicitada.",
      });
      return;
    }

    try {
      const { mediaType, tmdbId } = params.data;
      const { language, page } = query.data;

      const result = await getSimilarTitles(mediaType, tmdbId, language, page);

      res.json({
        page: result.page,
        totalPages: Math.min(result.total_pages, 100),
        totalResults: result.total_results,
        items: result.results.map((item) => ({
          id: item.id,
          mediaType,
          title:
            item.title ||
            item.name ||
            item.original_title ||
            item.original_name ||
            String(item.id),
          posterPath: item.poster_path,
        })),
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
          message: "No se pudieron consultar los títulos similares.",
        });
        return;
      }

      next(error);
    }
  },
);
