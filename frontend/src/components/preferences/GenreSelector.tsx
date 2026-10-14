import { useTranslation } from "react-i18next";
import type { Genre } from "../../services/catalog";
import type { ContentType } from "../../services/preferences";

interface GenreSelectorProps {
  contentType: ContentType;
  genres: {
    movie: Genre[];
    tv: Genre[];
  };
  movieGenreIds: number[];
  tvGenreIds: number[];
  onChange: (movieIds: number[], tvIds: number[]) => void;
  disabled?: boolean;
}

export function GenreSelector({
  contentType,
  genres,
  movieGenreIds,
  tvGenreIds,
  onChange,
  disabled = false,
}: GenreSelectorProps) {
  const { t, i18n } = useTranslation();

  const showMovies = contentType !== "tv";
  const showTv = contentType !== "movie";

  const visibleGenres = new Map<
    number,
    Genre & { mediaTypes: ("movie" | "tv")[] }
  >();

  for (const [mediaType, list] of [
    ["movie", showMovies ? genres.movie : []],
    ["tv", showTv ? genres.tv : []],
  ] as const) {
    for (const genre of list) {
      const existing = visibleGenres.get(genre.id);

      if (existing) {
        existing.mediaTypes.push(mediaType);
      } else {
        visibleGenres.set(genre.id, {
          ...genre,
          mediaTypes: [mediaType],
        });
      }
    }
  }

  const choices = [...visibleGenres.values()].sort((a, b) =>
    a.name.localeCompare(b.name, i18n.resolvedLanguage),
  );

  const allSelected =
    (!showMovies || movieGenreIds.length === 0) &&
    (!showTv || tvGenreIds.length === 0);

  function toggleGenre(
    id: number,
    mediaTypes: ("movie" | "tv")[],
    checked: boolean,
  ) {
    function update(ids: number[]) {
      return checked
        ? [...new Set([...ids, id])]
        : ids.filter((selectedId) => selectedId !== id);
    }

    onChange(
      mediaTypes.includes("movie") ? update(movieGenreIds) : movieGenreIds,
      mediaTypes.includes("tv") ? update(tvGenreIds) : tvGenreIds,
    );
  }

  return (
    <fieldset disabled={disabled}>
      <legend>{t("preferences.genres")}</legend>

      {choices.map((genre) => {
        const checked = genre.mediaTypes.every((mediaType) =>
          (mediaType === "movie" ? movieGenreIds : tvGenreIds).includes(
            genre.id,
          ),
        );

        return (
          <label
            key={genre.id}
            className={`preference-card${checked ? " is-selected" : ""}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => {
                toggleGenre(
                  genre.id,
                  genre.mediaTypes,
                  event.currentTarget.checked,
                );
              }}
            />
            {genre.name}
          </label>
        );
      })}

      <label className={`preference-card${allSelected ? " is-selected" : ""}`}>
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => {
            onChange(showMovies ? [] : movieGenreIds, showTv ? [] : tvGenreIds);
          }}
        />
        {t("preferences.allGenres")}
      </label>
    </fieldset>
  );
}
