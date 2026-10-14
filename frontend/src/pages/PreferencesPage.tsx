import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getPreferences, savePreferences } from "../services/preferences";
import type { Preferences } from "../services/preferences";
import { getPreferencesOptions } from "../services/catalog";
import type { PreferencesOptions } from "../services/catalog";
import { ApiError, getCommonErrorKey } from "../services/api";
import { ContentTypeSelector } from "../components/preferences/ContentTypeSelector";
import { GenreSelector } from "../components/preferences/GenreSelector";
import { ProviderSelector } from "../components/preferences/ProviderSelector";

export function PreferencesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const region = user?.region;

  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [options, setOptions] = useState<PreferencesOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId || !region) return;

    let cancelled = false;

    async function loadPreferences() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await getPreferences();

        if (cancelled) return;

        if (result.region !== region) {
          throw new Error("La región de la cuenta cambió");
        }

        setPreferences(result);
      } catch (error: unknown) {
        if (cancelled) return;

        setLoadError(getCommonErrorKey(error, "preferences.loadError"));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [userId, region]);

  useEffect(() => {
    if (!userId || !region) return;

    let cancelled = false;

    async function loadOptions() {
      setIsLoadingOptions(true);
      setOptionsError(null);

      try {
        const result = await getPreferencesOptions(language);

        if (cancelled) return;

        if (result.region !== region) {
          throw new Error("La región de la cuenta cambió");
        }

        setOptions(result);
      } catch (error: unknown) {
        if (cancelled) return;

        setOptionsError(getCommonErrorKey(error, "preferences.optionsError"));
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [userId, region, language]);

  async function handleSave(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !preferences ||
      !options ||
      isLoading ||
      isLoadingOptions ||
      isSaving ||
      preferences.region !== region ||
      options.region !== region
    ) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setIsSaved(false);

    try {
      const saved = await savePreferences(preferences);

      setPreferences((previous) =>
        previous?.region === saved.region ? saved : previous,
      );
      setIsSaved(true);
    } catch (error: unknown) {
      let errorKey = getCommonErrorKey(error, "preferences.saveError");

      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_PREFERENCES":
            errorKey = "preferences.invalidData";
            break;
          case "INVALID_GENRES":
            errorKey = "preferences.invalidGenres";
            break;
          case "INVALID_PROVIDERS":
            errorKey = "preferences.invalidProviders";
            break;
          case "PREFERENCES_REGION_CHANGED":
            errorKey = "preferences.regionChanged";
            break;
          case "SESSION_INVALID":
            errorKey = "settings.sessionInvalid";
            break;
        }
      }

      setSaveError(errorKey);
    } finally {
      setIsSaving(false);
    }
  }

  if (loadError) {
    return <p role="alert">{t(loadError)}</p>;
  }

  if (optionsError) {
    return <p role="alert">{t(optionsError)}</p>;
  }

  if (
    isLoading ||
    !preferences ||
    !options ||
    preferences.region !== region ||
    options.region !== region
  ) {
    return <p>{t("preferences.loading")}</p>;
  }

  return (
    <main>
      <h1>{t("preferences.title")}</h1>
      <p>{t("preferences.description")}</p>

      {isLoadingOptions && (
        <p role="status">{t("preferences.loadingOptions")}</p>
      )}

      <form onSubmit={handleSave}>
        <ContentTypeSelector
          value={preferences.contentType}
          disabled={isLoadingOptions || isSaving}
          onChange={(contentType) => {
            setIsSaved(false);
            setSaveError(null);
            setPreferences((previous) =>
              previous ? { ...previous, contentType } : previous,
            );
          }}
        />

        <GenreSelector
          contentType={preferences.contentType}
          genres={options.genres}
          movieGenreIds={preferences.movieGenreIds}
          tvGenreIds={preferences.tvGenreIds}
          disabled={isLoadingOptions || isSaving}
          onChange={(movieGenreIds, tvGenreIds) => {
            setIsSaved(false);
            setSaveError(null);
            setPreferences((previous) =>
              previous ? { ...previous, movieGenreIds, tvGenreIds } : previous,
            );
          }}
        />

        <ProviderSelector
          providers={options.providers}
          selectedIds={preferences.providerIds}
          disabled={isLoadingOptions || isSaving}
          onChange={(providerIds) => {
            setIsSaved(false);
            setSaveError(null);
            setPreferences((previous) =>
              previous ? { ...previous, providerIds } : previous,
            );
          }}
        />

        {saveError && <p role="alert">{t(saveError)}</p>}
        {isSaved && <p role="status">{t("preferences.saved")}</p>}

        <button type="submit" disabled={isSaving || isLoadingOptions}>
          {isSaving ? t("preferences.saving") : t("preferences.save")}
        </button>
      </form>
    </main>
  );
}
