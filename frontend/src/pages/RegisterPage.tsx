import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { RegisterForm } from "../components/auth/RegisterForm";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";
import logo from "../assets/icons/lumixplore--logo.svg";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { PageShell } from "../layouts/PageShell";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { usePageTitle } from "../hooks/usePageTitle";

import "./RegisterPage.css";

export function RegisterPage() {
  const { t } = useTranslation();
  const { user, loading, error } = useAuth();

  usePageTitle(t("register.pageTitle"));

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
    <PageShell colors={mainBackgroundColors}>
      <main className="register-page">
        <header className="register-page__header">
          <img src={logo} className="public-header__logo" />
          <div className="public-header__group">
            <LanguageSwitcher />
          </div>
        </header>

        <section className="register-form__section">
          <div className="register-form__container">
            <h1 className="register-form__section--title">
              {t("register.title")}
            </h1>
            <RegisterForm />

            <p className="register-form__login">
              {t("register.hasAccount")}{" "}
              <Link to="/login">{t("common.login")}</Link>
            </p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
