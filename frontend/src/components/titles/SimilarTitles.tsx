import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  getSimilarTitles,
  type MediaType,
  type SimilarTitlesResponse,
} from "../../services/titles";
import { getCommonErrorKey } from "../../services/api";
import { PosterImage } from "../explore/PosterImage";
import caretRightIcon from "../../assets/icons/caret-right.svg";
import "./SimilarTitles.css";

interface SimilarTitlesProps {
  mediaType: MediaType;
  tmdbId: number;
}

export function SimilarTitles({ mediaType, tmdbId }: SimilarTitlesProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  const [page, setPage] = useState(1);
  const [data, setData] = useState<SimilarTitlesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSimilarTitles() {
      setLoading(true);
      setErrorKey(null);

      try {
        const result = await getSimilarTitles(
          mediaType,
          tmdbId,
          language,
          page,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setErrorKey(getCommonErrorKey(error, "title.similarError"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSimilarTitles();

    return () => controller.abort();
  }, [mediaType, tmdbId, language, page]);

  if (loading) {
    return <p role="status">{t("title.similarLoading")}</p>;
  }

  if (errorKey) {
    return <p role="alert">{t(errorKey)}</p>;
  }

  if (!data || data.items.length === 0) {
    return <p>{t("title.similarEmpty")}</p>;
  }

  return (
    <section className="similar-titles">
      <ul className="similar-titles__list">
        {data.items.map((item) => (
          <li key={`${item.mediaType}-${item.id}`}>
            <Link
              to={`/title/${item.mediaType}/${item.id}`}
              aria-label={item.title}
            >
              {item.posterPath ? (
                <PosterImage
                  key={item.posterPath}
                  src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                  title={item.title}
                />
              ) : (
                <div className="similar-titles__placeholder">{item.title}</div>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {data.totalPages > 1 && (
        <nav className="pagination" aria-label={t("title.similarPagination")}>
          <button
            type="button"
            className="pagination__button pagination__button--previous"
            disabled={page <= 1}
            onClick={() => setPage((previous) => previous - 1)}
            aria-label={t("title.previousPage")}
          >
            <img src={caretRightIcon} alt="" />
          </button>

          <span className="pagination__label" aria-live="polite">
            {t("title.pageOf", {
              page: data.page,
              total: data.totalPages,
            })}
          </span>

          <button
            type="button"
            className="pagination__button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((previous) => previous + 1)}
            aria-label={t("title.nextPage")}
          >
            <img src={caretRightIcon} alt="" />
          </button>
        </nav>
      )}
    </section>
  );
}
