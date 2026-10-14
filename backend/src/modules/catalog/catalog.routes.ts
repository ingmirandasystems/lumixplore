import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  getWatchRegions,
  getGenres,
  getWatchProviders,
} from "../../services/tmdb.service.js";
import type { MediaType, WatchProvider } from "../../services/tmdb.service.js";

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
