import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <main>
        <h1>{t("resetPassword.incompleteTitle")}</h1>
        <p>{t("resetPassword.missingToken")}</p>
        <Link to="/forgot-password">{t("resetPassword.requestAnother")}</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>{t("resetPassword.title")}</h1>
      <ResetPasswordForm token={token} />
    </main>
  );
}
