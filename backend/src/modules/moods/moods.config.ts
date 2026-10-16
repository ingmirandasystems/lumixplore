import type { MediaType } from "../../services/tmdb.service.js";
import type { Mood } from "./moods.schemas.js";

export interface MoodRowDefinition {
  id: string;
  genreIds: Partial<Record<MediaType, number[]>>;
  genreMode: "all" | "any";
  keywordIds?: number[];
  keywordMode?: "all" | "any";
}

export const moodRows: Partial<Record<Mood, MoodRowDefinition[]>> = {
  laugh: [
    {
      id: "popularComedy",
      genreIds: {
        movie: [35],
        tv: [35],
      },
      genreMode: "all",
    },
    {
      id: "familyComedy",
      genreIds: {
        movie: [35, 10751],
        tv: [35, 10751],
      },
      genreMode: "all",
    },
    {
      id: "animatedComedy",
      genreIds: {
        movie: [35, 16],
        tv: [35, 16],
      },
      genreMode: "all",
    },
    {
      id: "romanticComedy",
      genreIds: {
        movie: [35, 10749],
      },
      genreMode: "all",
    },
    {
      id: "horrorComedy",
      genreIds: {
        movie: [35, 27],
      },
      genreMode: "all",
    },
  ],
  feel: [
    {
      id: "popularDrama",
      genreIds: {
        movie: [18],
        tv: [18],
      },
      genreMode: "all",
    },
    {
      id: "familyDrama",
      genreIds: {
        movie: [18, 10751],
        tv: [18, 10751],
      },
      genreMode: "all",
    },
    {
      id: "romanticDrama",
      genreIds: {
        movie: [18, 10749],
      },
      genreMode: "all",
    },
  ],
  tension: [
    {
      id: "demonicPossession",
      genreIds: {
        movie: [27],
        tv: [],
      },
      genreMode: "all",
      keywordIds: [161261],
    },
    {
      id: "bloodyHorror",
      genreIds: {
        movie: [27],
        tv: [],
      },
      genreMode: "all",
      keywordIds: [10292],
    },
    {
      id: "psychologicalThriller",
      genreIds: {
        movie: [],
        tv: [],
      },
      genreMode: "all",
      keywordIds: [12565],
    },
    {
      id: "supernaturalHorror",
      genreIds: {
        movie: [27],
        tv: [],
      },
      genreMode: "all",
      keywordIds: [256183],
    },
    {
      id: "serialKillers",
      genreIds: {
        movie: [],
        tv: [],
      },
      genreMode: "all",
      keywordIds: [10714],
    },
    {
      id: "mysteries",
      genreIds: {
        movie: [9648],
        tv: [9648],
      },
      genreMode: "all",
    },
  ],
  adrenaline: [
    {
      id: "heists",
      genreIds: {
        movie: [28, 53],
        tv: [80, 10759],
      },
      genreMode: "any",
      keywordIds: [10051, 191845],
      keywordMode: "any",
    },
    {
      id: "chases",
      genreIds: {
        movie: [28, 53],
        tv: [80, 10759],
      },
      genreMode: "any",
      keywordIds: [3713, 11148, 195295, 14967],
      keywordMode: "any",
    },
    {
      id: "survival",
      genreIds: {
        movie: [28, 12, 53],
        tv: [18, 10759],
      },
      genreMode: "any",
      keywordIds: [10349, 336497, 327857],
      keywordMode: "any",
    },
    {
      id: "actionAdventure",
      genreIds: {
        movie: [28],
        tv: [10759],
      },
      genreMode: "any",
    },
  ],

  escape: [
    {
      id: "magic",
      genreIds: {
        movie: [14],
        tv: [10765],
      },
      genreMode: "all",
      keywordIds: [2343, 283250],
      keywordMode: "any",
    },
    {
      id: "spaceTravel",
      genreIds: {
        movie: [878],
        tv: [10765],
      },
      genreMode: "all",
      keywordIds: [3801],
    },
    {
      id: "timeTravel",
      genreIds: {
        movie: [],
        tv: [],
      },
      genreMode: "any",
      keywordIds: [4379],
    },
    {
      id: "dystopias",
      genreIds: {
        movie: [],
        tv: [],
      },
      genreMode: "any",
      keywordIds: [4565],
    },
    {
      id: "otherWorlds",
      genreIds: {
        movie: [878, 14],
        tv: [10765],
      },
      genreMode: "any",
    },
  ],

  intense: [
    {
      id: "moralDilemmas",
      genreIds: {
        movie: [18, 53, 80],
        tv: [18, 80],
      },
      genreMode: "any",
      keywordIds: [198423],
    },
    {
      id: "obsession",
      genreIds: {
        movie: [18, 53, 80],
        tv: [18, 80],
      },
      genreMode: "any",
      keywordIds: [1523],
    },
    {
      id: "ambition",
      genreIds: {
        movie: [18, 53, 80],
        tv: [18, 80],
      },
      genreMode: "any",
      keywordIds: [3734],
    },
    {
      id: "psychologicalDrama",
      genreIds: {
        movie: [18],
        tv: [18],
      },
      genreMode: "all",
      keywordIds: [309029],
    },
    {
      id: "crimeConsequences",
      genreIds: {
        movie: [18, 80],
        tv: [18, 80],
      },
      genreMode: "all",
    },
  ],
};
