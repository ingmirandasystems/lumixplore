import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { getExplorePreferences } from "../explore/explore.service.js";
import { TmdbError } from "../../services/tmdb.service.js";
import { moodParamsSchema, moodQuerySchema } from "./moods.schemas.js";
import { moodRows } from "./moods.config.js";
import { getMoodSections } from "./moods.service.js";

export const moodsRouter = Router();

moodsRouter.get("/:mood", requireAuth, async (req, res, next) => {
  const params = moodParamsSchema.safeParse(req.params);
  const query = moodQuerySchema.safeParse(req.query);

  if (!params.success || !query.success) {
    res.status(400).json({
      code: "INVALID_MOOD_QUERY",
      message: "Revisa la experiencia, el idioma y la página.",
    });
    return;
  }

  const { mood } = params.data;

  if (!moodRows[mood]) {
    res.status(501).json({
      code: "MOOD_NOT_IMPLEMENTED",
      message: "Esta experiencia todavía no está disponible.",
    });
    return;
  }

  try {
    const preferences = await getExplorePreferences(res.locals.user.id);

    if (!preferences) {
      res.status(401).json({
        code: "SESSION_INVALID",
        message: "No hay una sesión válida.",
      });
      return;
    }

    const sections = await getMoodSections(mood, preferences, query.data);

    res.json({
      mood,
      region: preferences.region,
      contentType: preferences.contentType,
      sections,
    });
  } catch (error) {
    if (error instanceof TmdbError) {
      res.status(502).json({
        code: "CATALOG_UNAVAILABLE",
        message: "No se pudo consultar el catálogo.",
      });
      return;
    }

    next(error);
  }
});
