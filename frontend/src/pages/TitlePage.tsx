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
import { WatchlistButton } from "../components/titles/WatchlistButton";
import { PageShell } from "../layouts/PageShell";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { TitleLogo } from "../components/titles/TitleLogo";
import "./TitlePage.css";
import { usePageTitle } from "../hooks/usePageTitle";

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

  usePageTitle(title?.title ?? t("title.pageTitle"));

  if (!validMediaType || validId === null || loading || errorKey || !title) {
    return (
      <PageShell colors={mainBackgroundColors}>
        <main className="main-content">
          {!validMediaType || validId === null ? (
            <p role="alert">{t("title.notFound")}</p>
          ) : loading ? (
            <p role="status">{t("title.loading")}</p>
          ) : errorKey ? (
            <p role="alert">{t(errorKey)}</p>
          ) : (
            <p role="alert">{t("title.notFound")}</p>
          )}
        </main>
      </PageShell>
    );
  }

  return (
    <main className="title-page">
      <div className="title-page__background" aria-hidden="true">
        {title.backdropPath && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${title.backdropPath}`}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}

        <div className="title-page__background-gradients" />
      </div>

      {/*title.productionCompanies.length > 0 && (
        <div className="title-page__companies">
          {title.productionCompanies.map((company) => (
            <TitleLogo
              key={`${company.id}-${company.logoPath}`}
              path={company.logoPath}
              name={company.name}
              className="title-page__company-logo"
            />
          ))}
        </div>
      )*/}
      <div className="film-info__container">
        <div className="title-images__container">
          {/*featuredCompany && (
            <TitleLogo
              key={`${featuredCompany.id}-${featuredCompany.logoPath}`}
              path={featuredCompany.logoPath}
              name={featuredCompany.name}
              className="title-page__company-logo"
            />
          )*/}
          <h1 className="title-page__heading">
            <TitleLogo
              key={`${title.id}-${title.logoPath}`}
              path={title.logoPath}
              name={title.title}
              className="title-page__logo"
            />
          </h1>
        </div>

        <div className="title-info-description__container">
          <div className="title-description__container">
            {title.certification && (
              <>
                <span className="certification-container">
                  {" "}
                  <p>{title.certification.label}</p>
                </span>
                <div className="circle-separator"></div>
              </>
            )}

            {title.releaseDate && (
              <>
                <p>{title.releaseDate.slice(0, 4)}</p>{" "}
                <div className="circle-separator"></div>
              </>
            )}

            <p>{title.genres.map((genre) => genre.name).join(" · ")}</p>
          </div>

          <p className="title-overview">
            {title.overview || t("title.noOverview")}
          </p>

          <div className="divider"></div>

          <div className="title-buttons__container">
            <WatchlistButton
              key={`${title.mediaType}-${title.id}`}
              mediaType={title.mediaType}
              tmdbId={title.id}
            />

            <TitleWatchAvailability
              key={`${title.mediaType}-${title.id}-${title.watchAvailability.region}`}
              availability={title.watchAvailability}
            />
          </div>
        </div>
      </div>

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
