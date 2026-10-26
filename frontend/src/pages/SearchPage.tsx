import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { searchTitles, type SearchResponse } from "../services/search";
import { getCommonErrorKey } from "../services/api";
import { PageShell } from "../layouts/PageShell";
import { PosterImage } from "../components/explore/PosterImage";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import searchIcon from "../assets/icons/search.svg";
import caretRightIcon from "../assets/icons/caret-right.svg";
import "./SearchPage.css";
import errorIcon from "../assets/icons/error-icon.svg";
import notFoundRobot from "../assets/icons/not-found.svg";
import retryIcon from "../assets/icons/retry.svg";
import { usePageTitle } from "../hooks/usePageTitle";

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

  usePageTitle(
    validQuery ? t("search.resultsFor", { query }) : t("search.heading"),
  );

  return (
    <PageShell colors={mainBackgroundColors}>
      <main className="main-content">
        {!validQuery || !validPage ? (
          <div className="search-page__error--container">
            <img src={errorIcon} alt="" />
            <div>
              <h1>{t("search.heading")}</h1>
              <p>{t("search.invalidQuery")}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="results-title">
              <img src={searchIcon} alt="" />
              <h1>{t("search.resultsFor", { query })}</h1>
            </div>

            {loading ? (
              <p className="loading" role="status">
                {t("search.loading")}
              </p>
            ) : errorKey ? (
              <div className="error-server__container">
                <p role="alert">{t(errorKey)}</p>
                <button
                  type="button"
                  onClick={() => setRevision((previous) => previous + 1)}
                >
                  <img src={retryIcon} alt="" />
                  {t("search.retry")}
                </button>
              </div>
            ) : data ? (
              <>
                {data.sections.every(
                  (section) => section.items.length === 0,
                ) && (
                  <div className="not-found__container">
                    <p>
                      {t(
                        data.totalResults === 0
                          ? "search.empty"
                          : "search.emptyPage",
                      )}
                    </p>
                    <div className="not-found__icon">
                      <img src={notFoundRobot} alt="" />
                    </div>
                  </div>
                )}

                {data.sections.map((section) =>
                  section.items.length > 0 ? (
                    <section
                      key={section.mediaType}
                      className="results-mediatype-container"
                    >
                      <h2>
                        {t(
                          section.mediaType === "movie"
                            ? "search.movies"
                            : "search.series",
                        )}
                      </h2>

                      <ul className="search-results">
                        {section.items.map((item) => (
                          <li key={`${item.mediaType}-${item.id}`}>
                            <Link
                              className="poster-link"
                              to={`/title/${item.mediaType}/${item.id}`}
                              aria-label={item.title}
                            >
                              {item.posterPath ? (
                                <PosterImage
                                  key={item.posterPath}
                                  src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                                  title={item.title}
                                />
                              ) : (
                                <div
                                  className="poster-placeholder"
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
                  <nav
                    className="pagination"
                    aria-label={t("search.pagination")}
                  >
                    <button
                      type="button"
                      className="pagination__button pagination__button--previous"
                      disabled={page <= 1}
                      onClick={() => changePage(page - 1)}
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
                      onClick={() => changePage(page + 1)}
                      aria-label={t("title.nextPage")}
                    >
                      <img src={caretRightIcon} alt="" />
                    </button>
                  </nav>
                )}
              </>
            ) : null}
          </>
        )}
      </main>
    </PageShell>
  );
}
