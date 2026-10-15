import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  language: z.enum(["es", "en"]).default("en"),
  page: z.coerce.number().int().min(1).max(100).default(1),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
