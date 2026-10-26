import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFoundPage() {
  const { t } = useTranslation();

  usePageTitle(t("notFound.pageTitle"));

  return (
    <main>
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.description")}</p>
      <Link to="/">{t("common.backToHome")}</Link>
    </main>
  );
}
