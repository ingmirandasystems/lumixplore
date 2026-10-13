import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es.json";
import en from "./locales/en.json";

const savedLanguage = localStorage.getItem("lumixplore.language");
const initialLanguage = savedLanguage === "en" ? "en" : "es";

function updateDocumentLanguage(language: string) {
  document.documentElement.lang = language === "es" ? "es" : "en";
}

i18n.on("languageChanged", updateDocumentLanguage);

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: ["es", "en"],
  interpolation: {
    escapeValue: false,
  },
});

updateDocumentLanguage(initialLanguage);

export default i18n;
