import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getDailyRecommendation,
  type DailyRecommendation,
} from "../../services/explore";
import { getCommonErrorKey } from "../../services/api";

export function DailyRecommendationHero() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  const [recommendation, setRecommendation] =
    useState<DailyRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

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
    <section>
      <h1>{t("explore.dailyTitle")}</h1>

      {title.backdropPath && (
        <img
          src={`https://image.tmdb.org/t/p/w1280${title.backdropPath}`}
          alt=""
          style={{
            width: "100%",
            maxHeight: 480,
            objectFit: "cover",
            borderRadius: 12,
          }}
        />
      )}

      <h2>{title.title}</h2>

      {year && <p>{year}</p>}

      {title.genres.length > 0 && (
        <p>{title.genres.map((genre) => genre.name).join(" · ")}</p>
      )}

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

      <p>{title.overview || t("explore.dailyNoOverview")}</p>
    </section>
  );
}
