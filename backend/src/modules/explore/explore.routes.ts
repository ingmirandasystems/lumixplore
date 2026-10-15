import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { exploreQuerySchema } from "./explore.schemas.js";
import {
  getExplorePreferences,
  getExploreSections,
} from "./explore.service.js";

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
