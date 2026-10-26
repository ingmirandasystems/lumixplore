import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";
import "./LanguageSwitcher.css";
import global from "../assets/icons/globe.svg";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { user, loading, updateLanguage } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleChange(language: string) {
    if (language !== "es" && language !== "en") return;

    setIsSaving(true);
    setSaveError(null);

    try {
      if (user) {
        await updateLanguage(language);
      }

      localStorage.setItem("lumixplore.language", language);
      await i18n.changeLanguage(language);
    } catch (error: unknown) {
      setSaveError(getCommonErrorKey(error, "language.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="switcher-container">
      <label className="language-control">
        <img src={global} alt="" className="icon-language" />

        <span className="language-control__code" aria-hidden="true">
          {i18n.resolvedLanguage?.startsWith("en") ? "EN" : "ES"}
          <span> ▾</span>
        </span>

        <select
          aria-label={t("settings.language")}
          value={i18n.resolvedLanguage ?? "es"}
          disabled={loading || isSaving}
          onChange={(event) => {
            void handleChange(event.currentTarget.value);
          }}
        >
          <option value="es">{t("language.es")}</option>
          <option value="en">{t("language.en")}</option>
        </select>
      </label>

      {isSaving && <p role="status">{t("language.saving")}</p>}
      {saveError && <p role="alert">{t(saveError)}</p>}
    </div>
  );
}
