import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getMood, isMood, type MoodResponse } from "../services/moods";
import { ApiError, getCommonErrorKey } from "../services/api";

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

  if (!selectedMood) {
    return (
      <main>
        <p role="alert">{t("moods.invalidMood")}</p>
        <Link to="/explore">{t("moods.backToExplore")}</Link>
      </main>
    );
  }

  return (
    <main className="mood-page">
      <h1>{t(`moods.options.${selectedMood}`)}</h1>

      {loading ? (
        <p role="status">{t("moods.loading")}</p>
      ) : errorKey ? (
        <div>
          <p role="alert">{t(errorKey)}</p>

          <button
            type="button"
            onClick={() => setRevision((previous) => previous + 1)}
          >
            {t("moods.retry")}
          </button>
        </div>
      ) : data ? (
        <>
          {data.sections.length === 0 && <p>{t("moods.empty")}</p>}

          {data.sections.map((section) => (
            <section key={section.id} className="mood-section">
              <h2>{t(`moods.rows.${section.id}`)}</h2>

              {section.items.length === 0 ? (
                <p>{t("moods.empty")}</p>
              ) : (
                <ul
                  className="mood-section__list"
                  style={{
                    display: "flex",
                    gap: 16,
                    overflowX: "auto",
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  {section.items.map((item) => (
                    <li
                      key={`${item.mediaType}-${item.id}`}
                      style={{ flex: "0 0 160px" }}
                    >
                      <Link
                        to={`/title/${item.mediaType}/${item.id}`}
                        aria-label={item.title}
                      >
                        {item.posterPath ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                            alt=""
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
                              display: "grid",
                              placeItems: "center",
                              border: "1px solid currentColor",
                              borderRadius: 8,
                            }}
                          >
                            {item.title}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </>
      ) : null}
    </main>
  );
}
