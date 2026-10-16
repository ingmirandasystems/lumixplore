import { z } from "zod";

export const moodSchema = z.enum([
  "laugh",
  "feel",
  "tension",
  "adrenaline",
  "escape",
  "intense",
]);

export const moodParamsSchema = z.object({
  mood: moodSchema,
});

export const moodQuerySchema = z.object({
  language: z.enum(["es", "en"]).default("en"),
});

export type Mood = z.infer<typeof moodSchema>;
export type MoodQuery = z.infer<typeof moodQuerySchema>;
