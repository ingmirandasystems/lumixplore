import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <label>
      {t("language.label")}{" "}
      <select
        value={i18n.resolvedLanguage ?? "es"}
        onChange={(event) => {
          const language = event.currentTarget.value;

          localStorage.setItem("lumixplore.language", language);
          void i18n.changeLanguage(language);
        }}
      >
        <option value="es">{t("language.es")}</option>
        <option value="en">{t("language.en")}</option>
      </select>
    </label>
  );
}
