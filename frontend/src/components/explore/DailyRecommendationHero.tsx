import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getDailyRecommendation,
  type DailyRecommendation,
} from "../../services/explore";
import { getCommonErrorKey } from "../../services/api";
import { Link } from "react-router";
import "./DailyRecommendations.css";
import addIcon from "../../assets/icons/plus.svg";
import {
  getWatchlistStatus,
  setWatchlistStatus,
} from "../../services/watchlist";
import checkedIcon from "../../assets/icons/check.svg";

export function DailyRecommendationHero() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  const [recommendation, setRecommendation] =
    useState<DailyRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [isCheckingWatchlist, setIsCheckingWatchlist] = useState(true);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);

  const mediaType = recommendation?.title.mediaType;
  const tmdbId = recommendation?.title.id;

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendation() {
      setLoading(true);
      setErrorKey(null);

      try {
        const result = await getDailyRecommendation(language);

        if (!cancelled) {
          setRecommendation(result);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorKey(getCommonErrorKey(error, "explore.dailyError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecommendation();

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (!mediaType || tmdbId === undefined) return;

    const controller = new AbortController();

    // Capturamos los valores ya comprobados.
    const currentMediaType = mediaType;
    const currentTmdbId = tmdbId;

    async function checkStatus() {
      try {
        const result = await getWatchlistStatus(
          currentMediaType,
          currentTmdbId,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setInWatchlist(result.inWatchlist);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setWatchlistError(getCommonErrorKey(error, "watchlist.statusError"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingWatchlist(false);
        }
      }
    }

    void checkStatus();

    return () => controller.abort();
  }, [mediaType, tmdbId, language]);

  async function handleAddToWatchlist() {
    if (
      !mediaType ||
      tmdbId === undefined ||
      isCheckingWatchlist ||
      isAddingToWatchlist ||
      inWatchlist
    ) {
      return;
    }

    setIsAddingToWatchlist(true);
    setWatchlistError(null);

    try {
      const result = await setWatchlistStatus(mediaType, tmdbId, true);
      setInWatchlist(result.inWatchlist);
    } catch (error: unknown) {
      setWatchlistError(getCommonErrorKey(error, "watchlist.updateError"));
    } finally {
      setIsAddingToWatchlist(false);
    }
  }

  if (loading) {
    return <p role="status">{t("explore.dailyLoading")}</p>;
  }

  if (errorKey) {
    return <p role="alert">{t(errorKey)}</p>;
  }

  if (!recommendation) {
    return null;
  }

  const { title } = recommendation;
  const year = title.releaseDate?.slice(0, 4);

  return (
    <section className="daily-recommendation-section">
      <h1 className="daily-recommendation-title">{t("explore.dailyTitle")}</h1>

      <div className="daily-recommendation-container">
        <div className="daily-recommendation-bg__image">
          {title.backdropPath && (
            <img
              src={`https://image.tmdb.org/t/p/w1280${title.backdropPath}`}
              alt=""
            />
          )}
        </div>

        <div className="daily-recommendation-info">
          <h2 className="daily-recommendation-info__title">{title.title}</h2>

          <div className="daily-recommendation-info__time">
            {title.genres.length > 0 && (
              <p>{title.genres.map((genre) => genre.name).join(" · ")}</p>
            )}

            <div className="circle-separator"></div>

            {year && <p>{year}</p>}

            <div className="circle-separator"></div>

            {title.runtimeMinutes !== null && title.runtimeMinutes > 0 && (
              <p>
                {t(
                  title.mediaType === "movie"
                    ? "explore.dailyRuntime"
                    : "explore.dailyEpisodeRuntime",
                  { minutes: title.runtimeMinutes },
                )}
              </p>
            )}
          </div>

          <p className="daily-recommendation-info__overview">
            {title.overview || t("explore.dailyNoOverview")}
          </p>

          <div className="daily-recommendation-info__divider"></div>

          <div className="daily-recommendation-info__actions">
            <button
              type="button"
              className="daily-recommendation-info__addToList---btn"
              onClick={handleAddToWatchlist}
              disabled={
                isCheckingWatchlist || isAddingToWatchlist || inWatchlist
              }
              aria-busy={isCheckingWatchlist || isAddingToWatchlist}
            >
              <img src={inWatchlist ? checkedIcon : addIcon} alt="" />

              <span>
                {isCheckingWatchlist
                  ? t("watchlist.checking")
                  : isAddingToWatchlist
                    ? t("watchlist.adding")
                    : inWatchlist
                      ? t("watchlist.added")
                      : t("watchlist.add")}
              </span>
            </button>
            <Link
              className="daily-recommendation-info__viewDetails"
              to={`/title/${title.mediaType}/${title.id}`}
            >
              {t("explore.viewDetails")}
            </Link>
          </div>
          {watchlistError && (
            <p className="daily-recommendation-info__error" role="alert">
              {t(watchlistError)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
