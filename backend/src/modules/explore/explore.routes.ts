import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { exploreQuerySchema } from "./explore.schemas.js";
import {
  getExplorePreferences,
  getExploreSections,
} from "./explore.service.js";
import { dailyRecommendationQuerySchema } from "./explore.schemas.js";
import { getDailyRecommendation } from "./daily-recommendation.service.js";

export const exploreRouter = Router();

exploreRouter.get("/", requireAuth, async (req, res, next) => {
  const validation = exploreQuerySchema.safeParse(req.query);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_EXPLORE_QUERY",
      message: "Revisa el idioma y la página solicitada.",
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

    const sections = await getExploreSections(preferences, validation.data);

    res.json({
      region: preferences.region,
      contentType: preferences.contentType,
      sections,
    });
  } catch (error) {
    next(error);
  }
});

exploreRouter.get(
  "/daily-recommendation",
  requireAuth,
  async (req, res, next) => {
    const validation = dailyRecommendationQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_DAILY_RECOMMENDATION_QUERY",
        message: "Revisa el idioma solicitado.",
      });
      return;
    }

    try {
      const recommendation = await getDailyRecommendation(
        res.locals.user.id,
        validation.data.language,
      );

      if (!recommendation) {
        res.status(401).json({
          code: "SESSION_INVALID",
          message: "No hay una sesión válida.",
        });
        return;
      }

      res.json({ recommendation });
    } catch (error) {
      next(error);
    }
  },
);
