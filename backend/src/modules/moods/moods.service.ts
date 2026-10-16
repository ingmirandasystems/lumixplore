import { discoverTitles, type MediaType } from "../../services/tmdb.service.js";
import type { UpdatePreferencesData } from "../preferences/preferences.schemas.js";
import { moodRows } from "./moods.config.js";
import type { Mood, MoodQuery } from "./moods.schemas.js";

interface MoodTitle {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
}

function interleaveTitles(lists: MoodTitle[][]): MoodTitle[] {
  const items: MoodTitle[] = [];
  const seen = new Set<string>();
  const longestList = Math.max(0, ...lists.map((list) => list.length));

  for (let index = 0; index < longestList; index++) {
    for (const list of lists) {
      const item = list[index];

      if (!item) continue;

      const key = `${item.mediaType}-${item.id}`;

      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }

      if (items.length === 120) return items;
    }
  }

  return items;
}

export async function getMoodSections(
  mood: Mood,
  preferences: UpdatePreferencesData,
  query: MoodQuery,
) {
  const mediaTypes: MediaType[] =
    preferences.contentType === "both"
      ? ["movie", "tv"]
      : [preferences.contentType];

  const rows = moodRows[mood];

  if (!rows) {
    throw new Error(`Falta configurar la experiencia: ${mood}`);
  }

  const sections = await Promise.all(
    rows.map(async (row) => {
      const lists = await Promise.all(
        mediaTypes.map(async (mediaType): Promise<MoodTitle[]> => {
          const genreIds = row.genreIds[mediaType];

          if (!genreIds) return [];

          const candidates: MoodTitle[] = [];

          for (let page = 1; page <= 3; page++) {
            const result = await discoverTitles({
              mediaType,
              language: query.language,
              page,
              region: preferences.region,
              genreIds,
              genreMode: row.genreMode,
              providerIds: preferences.providerIds,
              keywordIds: row.keywordIds ?? [],
              keywordMode: row.keywordMode ?? "any",
            });

            candidates.push(
              ...result.results.map((item) => ({
                id: item.id,
                mediaType,
                title:
                  item.title ||
                  item.name ||
                  item.original_title ||
                  item.original_name ||
                  String(item.id),
                posterPath: item.poster_path,
              })),
            );

            if (page >= result.total_pages) break;
          }

          return candidates;
        }),
      );

      const supported = mediaTypes.some(
        (mediaType) => row.genreIds[mediaType] !== undefined,
      );

      if (!supported) return null;

      return {
        id: row.id,
        items: interleaveTitles(lists),
      };
    }),
  );

  const availableSections = sections.filter((section) => section !== null);

  const seen = new Set<string>();

  // Las filas específicas eligen primero; la general, al final.
  const prioritySections = [
    ...availableSections.filter(
      (section) => !["popularComedy", "popularDrama"].includes(section.id),
    ),
    ...availableSections.filter((section) =>
      ["popularComedy", "popularDrama"].includes(section.id),
    ),
  ];

  const uniqueItemsBySection = new Map<string, MoodTitle[]>();

  for (const section of prioritySections) {
    const uniqueItems: MoodTitle[] = [];

    for (const item of section.items) {
      const key = `${item.mediaType}-${item.id}`;

      if (seen.has(key)) continue;

      seen.add(key);
      uniqueItems.push(item);

      if (uniqueItems.length === 20) break;
    }

    uniqueItemsBySection.set(section.id, uniqueItems);
  }

  // Conservamos el orden visual original de las filas.
  return availableSections.map((section) => ({
    ...section,
    items: uniqueItemsBySection.get(section.id) ?? [],
  }));
}
