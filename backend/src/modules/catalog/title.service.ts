import {
  getFullTitleDetails,
  type CatalogLanguage,
  type MediaType,
  getTitleWatchAvailability,
  type WatchProvider,
} from "../../services/tmdb.service.js";

export async function getCatalogTitle(
  mediaType: MediaType,
  tmdbId: number,
  language: CatalogLanguage,
  region: string,
) {
  const [details, availability] = await Promise.all([
    getFullTitleDetails(mediaType, tmdbId, language),
    getTitleWatchAvailability(mediaType, tmdbId, region),
  ]);

  function normalizeProviders(providers: WatchProvider[] = []) {
    return [...providers]
      .sort(
        (a, b) =>
          a.display_priority - b.display_priority ||
          a.provider_name.localeCompare(b.provider_name, language),
      )
      .map((provider) => ({
        id: provider.provider_id,
        name: provider.provider_name,
        logoPath: provider.logo_path,
      }));
  }

  const trailers = details.videos.results
    .filter(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        /^[a-zA-Z0-9_-]{11}$/.test(video.key),
    )
    .sort(
      (a, b) =>
        Number(b.iso_639_1 === language) - Number(a.iso_639_1 === language) ||
        Number(b.official) - Number(a.official),
    );

  const trailer = trailers[0];

  let certification: string | null = null;

  if (mediaType === "movie") {
    const country = details.release_dates?.results.find(
      (item) => item.iso_3166_1 === region,
    );

    // Preferimos el estreno en cines y después otros formatos.
    const releasePriority = [3, 2, 4, 5, 6, 1];

    const releases = [...(country?.release_dates ?? [])]
      .filter((release) => release.certification.trim() !== "")
      .sort(
        (a, b) =>
          releasePriority.indexOf(a.type) - releasePriority.indexOf(b.type) ||
          a.release_date.localeCompare(b.release_date),
      );

    certification = releases[0]?.certification.trim() || null;
  } else {
    certification =
      details.content_ratings?.results
        .find((item) => item.iso_3166_1 === region)
        ?.rating.trim() || null;
  }

  return {
    id: details.id,
    mediaType,
    title:
      details.title ||
      details.name ||
      details.original_title ||
      details.original_name ||
      String(details.id),
    originalTitle: details.original_title || details.original_name || null,
    overview: details.overview,
    tagline: details.tagline || null,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    releaseDate: details.release_date || details.first_air_date || null,
    genres: details.genres,
    certification: certification
      ? {
          region,
          label: certification,
        }
      : null,
    runtimeMinutes:
      mediaType === "movie"
        ? details.runtime || null
        : details.episode_run_time?.[0] || null,

    status: details.status,
    originalLanguage: details.original_language,
    rating: {
      average: details.vote_average,
      count: details.vote_count,
    },

    movie:
      mediaType === "movie"
        ? {
            budget: details.budget || null,
            revenue: details.revenue || null,
            currency: "USD",
          }
        : null,

    series:
      mediaType === "tv"
        ? {
            seasons: details.number_of_seasons ?? null,
            episodes: details.number_of_episodes ?? null,
            inProduction: details.in_production ?? null,
            lastAirDate: details.last_air_date || null,
            creators: (details.created_by ?? []).map((person) => ({
              id: person.id,
              name: person.name,
              profilePath: person.profile_path,
            })),
            networks: (details.networks ?? []).map((network) => ({
              id: network.id,
              name: network.name,
              logoPath: network.logo_path,
            })),
          }
        : null,

    productionCompanies: details.production_companies.map((company) => ({
      id: company.id,
      name: company.name,
      logoPath: company.logo_path,
      country: company.origin_country,
    })),

    productionCountries: details.production_countries.map((country) => ({
      code: country.iso_3166_1,
      name: country.name,
    })),

    spokenLanguages: details.spoken_languages.map((spokenLanguage) => ({
      code: spokenLanguage.iso_639_1,
      name: spokenLanguage.name,
      englishName: spokenLanguage.english_name,
    })),

    cast: [...details.credits.cast]
      .sort((a, b) => a.order - b.order)
      .map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character,
        profilePath: person.profile_path,
      })),

    crew: details.credits.crew.map((person) => ({
      id: person.id,
      name: person.name,
      job: person.job,
      department: person.department,
      profilePath: person.profile_path,
    })),

    trailer: trailer
      ? {
          youtubeKey: trailer.key,
          name: trailer.name,
          language: trailer.iso_639_1,
          official: trailer.official,
        }
      : null,
    watchAvailability: {
      region,
      link: availability?.link ?? null,
      subscription: normalizeProviders(availability?.flatrate),
      rent: normalizeProviders(availability?.rent),
      buy: normalizeProviders(availability?.buy),
      free: normalizeProviders(availability?.free),
      ads: normalizeProviders(availability?.ads),
    },
  };
}
