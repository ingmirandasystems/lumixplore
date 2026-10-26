import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";
import "./ForgotPasswordPage.css";
import logo from "../assets/icons/lumixplore--logo.svg";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { PageShell } from "../layouts/PageShell";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { usePageTitle } from "../hooks/usePageTitle";

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  usePageTitle(t("forgotPassword.pageTitle"));

  return (
    <PageShell colors={mainBackgroundColors}>
      <main className="forgotPassword-page">
        <header className="forgotPassword-page__header">
          <img src={logo} className="public-header__logo" />
          <div className="public-header__group">
            <LanguageSwitcher />
          </div>
        </header>

        <section className="forgotPassword-form__section">
          <div className="forgotPassword-form__container">
            <h1 className="forgotPassword-form__section--title">
              {t("forgotPassword.title")}
            </h1>
            <p className="forgotPassword-description">
              {t("forgotPassword.description")}
            </p>

            <ForgotPasswordForm />

            <Link className="forgotPassword-login" to="/login">
              {t("common.backToLogin")}
            </Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
