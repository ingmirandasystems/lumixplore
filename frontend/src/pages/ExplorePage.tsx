import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";
import { getExplore } from "../services/explore";
import type { ExploreResponse } from "../services/explore";
import { DailyRecommendationHero } from "../components/explore/DailyRecommendationHero";
import { Link } from "react-router";

export function ExplorePage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const userId = user?.id;
  const region = user?.region;

  const [data, setData] = useState<ExploreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

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

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
    } catch (error: unknown) {
      setLogoutError(getCommonErrorKey(error, "session.logoutError"));
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return <p>{t("session.noSession")}</p>;
  }

  return (
    <main>
      <p>{t("session.currentUser", { name: user.name })}</p>

      {logoutError && <p role="alert">{t(logoutError)}</p>}

      <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? t("session.loggingOut") : t("session.logout")}
      </button>

      <DailyRecommendationHero />

      {isLoading ? (
        <p role="status">{t("explore.loading")}</p>
      ) : loadError ? (
        <p role="alert">{t(loadError)}</p>
      ) : (
        data?.sections.map((section) => (
          <section key={section.mediaType}>
            <h2>
              {t(
                section.mediaType === "movie"
                  ? "explore.popularMovies"
                  : "explore.popularSeries",
              )}
            </h2>

            {section.items.length === 0 ? (
              <p>{t("explore.empty")}</p>
            ) : (
              <ul
                style={{
                  display: "flex",
                  gap: 16,
                  overflowX: "auto",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {section.items.map((item) => (
                  <Link
                    to={`/title/${item.mediaType}/${item.id}`}
                    aria-label={item.title}
                  >
                    <li
                      key={`${item.mediaType}-${item.id}`}
                      style={{ flex: "0 0 160px" }}
                    >
                      {item.posterPath ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                          alt={item.title}
                          width={160}
                          height={240}
                          loading="lazy"
                          style={{
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 160,
                            height: 240,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid currentColor",
                            borderRadius: 8,
                          }}
                        >
                          {item.title}
                        </div>
                      )}
                    </li>
                  </Link>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </main>
  );
}
