import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { searchTitles, type SearchResponse } from "../services/search";
import { getCommonErrorKey } from "../services/api";

export function SearchPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const rawPage = searchParams.get("page") ?? "1";
  const page = Number(rawPage);

  const validQuery = query.length > 0 && query.length <= 200;
  const validPage =
    /^[1-9]\d*$/.test(rawPage) && Number.isInteger(page) && page <= 100;

  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!validQuery || !validPage) return;

    const controller = new AbortController();

    async function loadResults() {
      setLoading(true);
      setErrorKey(null);

      try {
        const result = await searchTitles(
          query,
          language,
          page,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setErrorKey(getCommonErrorKey(error, "search.loadError"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => controller.abort();
  }, [query, language, page, validQuery, validPage, revision]);

  function changePage(nextPage: number) {
    const parameters = new URLSearchParams(searchParams);
    parameters.set("page", String(nextPage));
    setSearchParams(parameters);
  }

  if (!validQuery || !validPage) {
    return (
      <main>
        <h1>{t("search.heading")}</h1>
        <p>{t("search.invalidQuery")}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>{t("search.resultsFor", { query })}</h1>

      {loading ? (
        <p role="status">{t("search.loading")}</p>
      ) : errorKey ? (
        <div>
          <p role="alert">{t(errorKey)}</p>
          <button
            type="button"
            onClick={() => setRevision((previous) => previous + 1)}
          >
            {t("search.retry")}
          </button>
        </div>
      ) : data ? (
        <>
          {data.sections.every((section) => section.items.length === 0) && (
            <p>
              {t(data.totalResults === 0 ? "search.empty" : "search.emptyPage")}
            </p>
          )}

          {data.sections.map((section) =>
            section.items.length > 0 ? (
              <section key={section.mediaType}>
                <h2>
                  {t(
                    section.mediaType === "movie"
                      ? "search.movies"
                      : "search.series",
                  )}
                </h2>

                <ul
                  className="search-results"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: 16,
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  {section.items.map((item) => (
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
              </section>
            ) : null,
          )}

          {data.totalPages > 0 && (
            <nav aria-label={t("search.pagination")}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => changePage(page - 1)}
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
                onClick={() => changePage(page + 1)}
              >
                {t("title.nextPage")}
              </button>
            </nav>
          )}
        </>
      ) : null}
    </main>
  );
}
