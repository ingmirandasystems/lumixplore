import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <main>
      <h1>{t("forgotPassword.title")}</h1>
      <p>{t("forgotPassword.description")}</p>

      <ForgotPasswordForm />

      <Link to="/login">{t("common.backToLogin")}</Link>
    </main>
  );
}
