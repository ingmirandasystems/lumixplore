import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getCatalogTitle, type CatalogTitle } from "../services/titles";
import { ApiError, getCommonErrorKey } from "../services/api";
import { TitleTabs } from "../components/titles/TitleTabs";
import { TitleExtraInfo } from "../components/titles/TitleExtraInfo";
import { TitleTrailer } from "../components/titles/TitleTrailer";
import { SimilarTitles } from "../components/titles/SimilarTitles";
import { TitleWatchAvailability } from "../components/titles/TitleWatchAvailability";

export function TitlePage() {
  const { mediaType, tmdbId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const region = user?.region;

  const validMediaType =
    mediaType === "movie" || mediaType === "tv" ? mediaType : null;

  const numericId = tmdbId && /^[1-9]\d*$/.test(tmdbId) ? Number(tmdbId) : NaN;

  const validId = Number.isSafeInteger(numericId) ? numericId : null;

  const [title, setTitle] = useState<CatalogTitle | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!validMediaType || validId === null) {
      return;
    }

    const controller = new AbortController();

    async function loadTitle() {
      setLoading(true);
      setErrorKey(null);
      setTitle(null);

      try {
        const result = await getCatalogTitle(
          validMediaType!,
          validId!,
          language,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setTitle(result);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        let key = getCommonErrorKey(error, "title.loadError");

        if (error instanceof ApiError && error.code === "TITLE_NOT_FOUND") {
          key = "title.notFound";
        }

        setErrorKey(key);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTitle();

    return () => {
      controller.abort();
    };
  }, [validMediaType, validId, language, region]);

  if (!validMediaType || validId === null) {
    return <p role="alert">{t("title.notFound")}</p>;
  }

  if (loading) {
    return <p role="status">{t("title.loading")}</p>;
  }

  if (errorKey) {
    return <p role="alert">{t(errorKey)}</p>;
  }

  if (!title) return null;

  return (
    <main>
      {title.backdropPath && (
        <img
          src={`https://image.tmdb.org/t/p/w1280${title.backdropPath}`}
          alt=""
          style={{
            width: "100%",
            maxHeight: 480,
            objectFit: "cover",
          }}
        />
      )}

      <h1>{title.title}</h1>

      {title.releaseDate && <p>{title.releaseDate.slice(0, 4)}</p>}

      {title.certification && <p>{title.certification.label}</p>}

      <p>{title.genres.map((genre) => genre.name).join(" · ")}</p>

      <p>{title.overview || t("title.noOverview")}</p>

      <TitleWatchAvailability
        key={`${title.mediaType}-${title.id}-${title.watchAvailability.region}`}
        availability={title.watchAvailability}
      />

      <TitleTabs
        key={`${title.mediaType}-${title.id}`}
        similar={
          <SimilarTitles
            key={`${title.mediaType}-${title.id}`}
            mediaType={title.mediaType}
            tmdbId={title.id}
          />
        }
        extra={<TitleExtraInfo title={title} />}
        trailer={
          title.trailer ? (
            <TitleTrailer trailer={title.trailer} titleName={title.title} />
          ) : undefined
        }
      />
    </main>
  );
}
