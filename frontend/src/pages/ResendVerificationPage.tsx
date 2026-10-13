import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ResendVerificationForm } from "../components/auth/ResendVerificationForm";

export function ResendVerificationPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const state: unknown = location.state;

  const initialEmail =
    typeof state === "object" &&
    state !== null &&
    "email" in state &&
    typeof state.email === "string"
      ? state.email
      : "";

  return (
    <main>
      <h1>{t("resend.title")}</h1>
      <p>{t("resend.description")}</p>

      <ResendVerificationForm initialEmail={initialEmail} />

      <Link to="/login">{t("common.backToLogin")}</Link>
    </main>
  );
}
