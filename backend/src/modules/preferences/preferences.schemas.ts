import { z } from "zod";

const selectedIdsSchema = z
  .array(z.number().int().positive())
  .max(100)
  .transform((ids) => [...new Set(ids)]);

export const updatePreferencesSchema = z.object({
  contentType: z.enum(["movie", "tv", "both"]),
  movieGenreIds: selectedIdsSchema,
  tvGenreIds: selectedIdsSchema,
  providerIds: selectedIdsSchema,
  region: z.string().regex(/^[A-Z]{2}$/),
});

export type UpdatePreferencesData = z.infer<typeof updatePreferencesSchema>;
