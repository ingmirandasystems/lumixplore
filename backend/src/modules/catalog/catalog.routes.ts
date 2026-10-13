import { Router } from "express";
import { getWatchRegions } from "../../services/tmdb.service.js";

export const catalogRouter = Router();

catalogRouter.get("/regions", async (_req, res, next) => {
  try {
    const regions = await getWatchRegions();

    res.json({ regions });
  } catch (error) {
    next(error);
  }
});
