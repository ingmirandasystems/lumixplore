import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { RegisterForm } from "../components/auth/RegisterForm";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";

export function RegisterPage() {
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
      <h1>{t("register.title")}</h1>
      <RegisterForm />

      <p>
        {t("register.hasAccount")} <Link to="/login">{t("common.login")}</Link>
      </p>
    </main>
  );
}
