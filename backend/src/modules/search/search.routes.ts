import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { searchQuerySchema } from "./search.schemas.js";
import {
  searchTitles,
  TmdbError,
  type MediaType,
} from "../../services/tmdb.service.js";

export const searchRouter = Router();

searchRouter.get("/", requireAuth, async (req, res, next) => {
  const validation = searchQuerySchema.safeParse(req.query);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_SEARCH_QUERY",
      message: "Revisa el texto, el idioma y la página de búsqueda.",
    });
    return;
  }

  try {
    const { q, language, page } = validation.data;

    const sections = await Promise.all(
      (["movie", "tv"] as const).map(async (mediaType: MediaType) => {
        const result = await searchTitles(mediaType, q, language, page);

        return {
          mediaType,
          page: result.page,
          totalPages: Math.min(result.total_pages, 100),
          totalResults: result.total_results,
          items: (page <= result.total_pages ? result.results : []).map(
            (item) => ({
              id: item.id,
              mediaType,
              title:
                item.title ||
                item.name ||
                item.original_title ||
                item.original_name ||
                String(item.id),
              posterPath: item.poster_path,
              releaseDate: item.release_date || item.first_air_date || null,
            }),
          ),
        };
      }),
    );

    res.json({
      query: q,
      page,
      totalPages: Math.max(...sections.map((section) => section.totalPages)),
      totalResults: sections.reduce(
        (total, section) => total + section.totalResults,
        0,
      ),
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
