import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ResendVerificationForm } from "../components/auth/ResendVerificationForm";
import logo from "../assets/icons/lumixplore--logo.svg";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { PageShell } from "../layouts/PageShell";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import "./ResendVerificationPage.css";
import { usePageTitle } from "../hooks/usePageTitle";

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

  usePageTitle(t("resend.pageTitle"));

  return (
    <PageShell colors={mainBackgroundColors}>
      <main className="resendVerification-page">
        <header className="resendVerification-page__header">
          <img src={logo} className="public-header__logo" />
          <div className="public-header__group">
            <LanguageSwitcher />
          </div>
        </header>

        <section className="resendVerification-form__section">
          <div className="resendVerification-form__container">
            <h1 className="resendVerification-form__section--title">
              {t("resend.title")}
            </h1>
            <p className="resendVerification-description">
              {t("resend.description")}
            </p>

            <ResendVerificationForm initialEmail={initialEmail} />

            <Link className="resendVerification-login" to="/login">
              {t("common.backToLogin")}
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
