import { z } from "zod";

export const exploreQuerySchema = z.object({
  language: z.enum(["es", "en"]).default("en"),
  page: z.coerce.number().int().min(1).max(100).default(1),
});

export type ExploreQuery = z.infer<typeof exploreQuerySchema>;

export const dailyRecommendationQuerySchema = z.object({
  language: z.enum(["es", "en"]).default("en"),
});
