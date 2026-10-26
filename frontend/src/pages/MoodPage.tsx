import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getMood, isMood, type MoodResponse } from "../services/moods";
import { ApiError, getCommonErrorKey } from "../services/api";
import { PageShell } from "../layouts/PageShell";
import { ScrollableRow } from "../components/explore/ScrollableRow";
import { moodIds } from "../services/moods";
import { PosterImage } from "../components/explore/PosterImage";
import retryIcon from "../assets/icons/retry.svg";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import errorIcon from "../assets/icons/error-icon.svg";
import { usePageTitle } from "../hooks/usePageTitle";

type MoodId = (typeof moodIds)[number];
type BackgroundColors = [string, string, string, string, string];

const moodBackgroundColors: Record<MoodId, BackgroundColors> = {
  laugh: ["#FF7700", "#FFB347", "#FFD400", "#FFD60A", "#FFF3B5"],
  feel: ["#0A4BFF", "#2EACE6", "#47D1FF", "#62BEE3", "#BDDDF9"],
  tension: ["#461C1C", "#5A0202", "#900000", "#F9BDBD", "#FF0000"],
  adrenaline: ["#4C6A13", "#A8FF00", "#B6FF2E", "#C9EF7F", "#FFFB00"],
  escape: ["#9B5CFF", "#5C50CE", "#B750CE", "#B997EF", "#D9B7FF"],
  intense: ["#000000", "#404040", "#8E8E8E", "#CDCDCD", "#FFFFFF"],
};

function isMoodId(value: string | undefined): value is MoodId {
  return moodIds.some((id) => id === value);
}

export function MoodPage() {
  const { mood } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const selectedMood = isMood(mood) ? mood : null;
  const userId = user?.id;
  const region = user?.region;

  const [data, setData] = useState<MoodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!selectedMood || !userId || !region) return;

    const controller = new AbortController();
    const requestedMood = selectedMood;

    async function loadMood() {
      setLoading(true);
      setErrorKey(null);
      setData(null);

      try {
        const result = await getMood(
          requestedMood,
          language,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        if (result.region !== region) {
          throw new Error("La región de la cuenta cambió");
        }

        setData(result);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        const key =
          error instanceof ApiError && error.code === "MOOD_NOT_IMPLEMENTED"
            ? "moods.notImplemented"
            : getCommonErrorKey(error, "moods.loadError");

        setErrorKey(key);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMood();

    return () => controller.abort();
  }, [selectedMood, userId, region, language, revision]);

  usePageTitle(
    mood
      ? `${t(`moods.pages.${mood}.titleTop`)} ${t(
          `moods.pages.${mood}.titleBottom`,
        )}`
      : t("explore.pageTitle"),
  );

  return (
    <PageShell
      colors={
        isMoodId(mood) ? moodBackgroundColors[mood] : mainBackgroundColors
      }
    >
      <main className="main-content">
        {!isMoodId(mood) || !selectedMood ? (
          <main className="auth-error__container">
            <img src={errorIcon} alt="" />
            <div>
              <p role="alert">{t("moods.invalidMood")}</p>
              <Link to="/explore">{t("moods.backToExplore")}</Link>
            </div>
          </main>
        ) : (
          <>
            <div className={`mood-page__intro mood-page__intro--${mood}`}>
              <h1 className="mood-page__title">
                <span className="mood-page__title-top">
                  {t(`moods.pages.${mood}.titleTop`)}
                </span>{" "}
                <span className="mood-page__title-bottom">
                  {t(`moods.pages.${mood}.titleBottom`)}
                </span>
              </h1>

              <div className="mood-page__subtitle--container">
                <span
                  className="mood-page__subtitle--decoration"
                  aria-hidden="true"
                />
                <p className="mood-page__subtitle">
                  {t(`moods.pages.${mood}.subtitle`)}
                </p>
              </div>
            </div>

            {loading ? (
              <p className="loading" role="status">
                {t("moods.loading")}
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
                {data.sections.length === 0 && <p>{t("moods.empty")}</p>}

                {data.sections.map((section) => (
                  <section key={section.id} className="film-row">
                    <h2 className="row-title">
                      {t(`moods.rows.${section.id}`)}
                    </h2>

                    {section.items.length === 0 ? (
                      <p className="row-empty">{t("moods.empty")}</p>
                    ) : (
                      <ScrollableRow>
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
                                  src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                                  title={item.title}
                                />
                              ) : (
                                <div
                                  className="poster-placeholder"
                                  style={{
                                    border: "1px solid currentColor",
                                  }}
                                >
                                  {item.title}
                                </div>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ScrollableRow>
                    )}
                  </section>
                ))}
              </>
            ) : null}
          </>
        )}
      </main>
    </PageShell>
  );
}
