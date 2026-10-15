import { z } from "zod";

export const watchlistTitleParamsSchema = z.object({
  mediaType: z.enum(["movie", "tv"]),
  tmdbId: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .refine((value) => Number.isSafeInteger(value) && value <= 2_147_483_647),
});

export const watchlistQuerySchema = z.object({
  language: z.enum(["es", "en"]).default("en"),
  page: z.coerce.number().int().min(1).default(1),
});
