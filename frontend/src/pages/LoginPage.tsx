import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/auth/LoginForm";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";

export function LoginPage() {
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
      <h1>{t("login.title")}</h1>
      <LoginForm />

      <p>
        <Link to="/resend-verification">{t("login.needsVerification")}</Link>
      </p>

      <p>
        {t("login.noAccount")}{" "}
        <Link to="/register">{t("common.register")}</Link>
      </p>

      <p>
        <Link to="/forgot-password">{t("login.forgotPassword")}</Link>
      </p>

      <p>{t("login.googleAlternative")}</p>
      <GoogleLoginButton />
    </main>
  );
}
