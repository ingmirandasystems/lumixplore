import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";
import { getExplore } from "../services/explore";
import type { ExploreResponse } from "../services/explore";
import { DailyRecommendationHero } from "../components/explore/DailyRecommendationHero";
import { Link } from "react-router";
import { PageShell } from "../layouts/PageShell";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { ScrollableRow } from "../components/explore/ScrollableRow";
import { PosterImage } from "../components/explore/PosterImage";
import { usePageTitle } from "../hooks/usePageTitle";

export function ExplorePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const userId = user?.id;
  const region = user?.region;

  const [data, setData] = useState<ExploreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !region) return;

    let cancelled = false;

    async function loadTitles() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await getExplore(language);

        if (cancelled) return;

        if (result.region !== region) {
          throw new Error("La región de la cuenta cambió");
        }

        setData(result);
      } catch (error: unknown) {
        if (cancelled) return;

        setLoadError(getCommonErrorKey(error, "explore.loadError"));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTitles();

    return () => {
      cancelled = true;
    };
  }, [userId, region, language]);

  usePageTitle(t("explore.pageTitle"));

  if (!user) {
    return <p>{t("session.noSession")}</p>;
  }

  return (
    <PageShell colors={mainBackgroundColors}>
      <main className="main-content">
        <DailyRecommendationHero />

        {isLoading ? (
          <p className="loading" role="status">
            {t("explore.loading")}
          </p>
        ) : loadError ? (
          <div className="error-server__container">
            <p role="alert">{t(loadError)}</p>
          </div>
        ) : (
          data?.sections.map((section) => {
            const headingKeys = {
              trending: {
                movie: "explore.trendingMovies",
                tv: "explore.trendingSeries",
              },
              popular: {
                movie: "explore.popularMovies",
                tv: "explore.popularSeries",
              },
              topRated: {
                movie: "explore.topRatedMovies",
                tv: "explore.topRatedSeries",
              },
            };

            const headingKey = headingKeys[section.kind][section.mediaType];

            return (
              <section key={section.id} className="film-row">
                <h2 className="row-title">{t(headingKey)}</h2>

                {section.items.length === 0 ? (
                  <p className="row-empty">{t("explore.empty")}</p>
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
                              src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
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
            );
          })
        )}
      </main>
    </PageShell>
  );
}
