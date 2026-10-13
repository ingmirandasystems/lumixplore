import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";

export function HomePage() {
  const { t } = useTranslation();
  const { user, loading, error } = useAuth();

  if (loading) {
    return <p>{t("session.checking")}</p>;
  }

  if (error) {
    return (
      <p role="alert">{t(getCommonErrorKey(error, "session.checkError"))}</p>
    );
  }

  if (user) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <main>
      <h1>{t("home.title")}</h1>
      <p>{t("home.description")}</p>

      <Link to="/login">{t("common.login")}</Link>
      <Link to="/register">{t("common.register")}</Link>
    </main>
  );
}
