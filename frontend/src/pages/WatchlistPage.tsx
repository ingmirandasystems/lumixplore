import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  getWatchlist,
  setWatchlistStatus,
  type WatchlistResponse,
} from "../services/watchlist";
import type { MediaType } from "../services/titles";
import { getCommonErrorKey } from "../services/api";
import { PageShell } from "../layouts/PageShell";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { PosterImage } from "../components/explore/PosterImage";
import "./WatchlistPage.css";
import { usePageTitle } from "../hooks/usePageTitle";

export function WatchlistPage() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  const [page, setPage] = useState(1);
  const [data, setData] = useState<WatchlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWatchlist() {
      setLoading(true);
      setErrorKey(null);

      try {
        const result = await getWatchlist(language, page, controller.signal);

        if (controller.signal.aborted) return;

        if (page > 1 && page > result.totalPages) {
          setPage(Math.max(1, result.totalPages));
          return;
        }

        setData(result);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setErrorKey(getCommonErrorKey(error, "watchlist.loadError"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadWatchlist();

    return () => controller.abort();
  }, [language, page, revision]);

  async function handleRemove(mediaType: MediaType, tmdbId: number) {
    if (removing) return;

    setRemoving(`${mediaType}-${tmdbId}`);
    setRemoveError(null);

    try {
      await setWatchlistStatus(mediaType, tmdbId, false);
      setRevision((previous) => previous + 1);
    } catch (error: unknown) {
      setRemoveError(getCommonErrorKey(error, "watchlist.updateError"));
    } finally {
      setRemoving(null);
    }
  }

  usePageTitle(t("watchlist.heading"));

  return (
    <PageShell colors={mainBackgroundColors}>
      <main className="main-content watchlist-page">
        <h1>{t("watchlist.heading")}</h1>

        {loading ? (
          <p role="status">{t("watchlist.loading")}</p>
        ) : errorKey ? (
          <div>
            <p role="alert">{t(errorKey)}</p>
            <button
              type="button"
              onClick={() => setRevision((previous) => previous + 1)}
            >
              {t("watchlist.retry")}
            </button>
          </div>
        ) : !data || data.totalResults === 0 ? (
          <p>{t("watchlist.empty")}</p>
        ) : (
          <>
            {removeError && <p role="alert">{t(removeError)}</p>}

            <ul className="watchlist-grid">
              {data.items.map((item) => {
                const itemKey = `${item.mediaType}-${item.id}`;
                const name = item.title || t("watchlist.unavailable");

                const poster = item.posterPath ? (
                  <PosterImage
                    title={name}
                    src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                  />
                ) : (
                  <div className="poster-placeholder">{name}</div>
                );

                return (
                  <li key={itemKey}>
                    {item.available ? (
                      <Link
                        to={`/title/${item.mediaType}/${item.id}`}
                        aria-label={name}
                      >
                        {poster}
                      </Link>
                    ) : (
                      poster
                    )}

                    <button
                      type="button"
                      disabled={removing !== null}
                      aria-label={t("watchlist.removeNamed", { name })}
                      onClick={() => {
                        void handleRemove(item.mediaType, item.id);
                      }}
                    >
                      {removing === itemKey
                        ? t("watchlist.saving")
                        : t("watchlist.remove")}
                    </button>
                  </li>
                );
              })}
            </ul>

            {data.totalPages > 1 && (
              <nav aria-label={t("watchlist.pagination")}>
                <button
                  type="button"
                  disabled={page <= 1 || removing !== null}
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
                  disabled={page >= data.totalPages || removing !== null}
                  onClick={() => setPage((previous) => previous + 1)}
                >
                  {t("title.nextPage")}
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}
