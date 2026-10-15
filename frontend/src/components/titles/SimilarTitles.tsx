import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  getSimilarTitles,
  type MediaType,
  type SimilarTitlesResponse,
} from "../../services/titles";
import { getCommonErrorKey } from "../../services/api";

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
      <ul
        className="similar-titles__list"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 16,
          listStyle: "none",
          padding: 0,
        }}
      >
        {data.items.map((item) => (
          <li key={`${item.mediaType}-${item.id}`}>
            <Link
              to={`/title/${item.mediaType}/${item.id}`}
              aria-label={item.title}
            >
              {item.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    aspectRatio: "2 / 3",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    aspectRatio: "2 / 3",
                    display: "grid",
                    placeItems: "center",
                    background: "#333",
                  }}
                >
                  {item.title}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {data.totalPages > 1 && (
        <nav aria-label={t("title.similarPagination")}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((previous) => previous - 1)}
          >
            {t("title.previousPage")}
          </button>

          <span aria-live="polite">
            {t("title.pageOf", {
              page: data.page,
              total: data.totalPages,
            })}
          </span>

          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((previous) => previous + 1)}
          >
            {t("title.nextPage")}
          </button>
        </nav>
      )}
    </section>
  );
}
