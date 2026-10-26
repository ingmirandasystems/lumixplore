import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { LoginForm } from "../components/auth/LoginForm";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";
import logo from "../assets/icons/lumixplore--logo.svg";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { PageShell } from "../layouts/PageShell";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Trans } from "react-i18next";
import "./LoginPage.css";
import { usePageTitle } from "../hooks/usePageTitle";

export function LoginPage() {
  const { t } = useTranslation();
  const { user, loading, error } = useAuth();

  usePageTitle(t("login.pageTitle"));

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
      <main className="login-page">
        <header className="login-page__header">
          <img src={logo} className="public-header__logo" />
          <div className="public-header__group">
            <LanguageSwitcher />
          </div>
        </header>
        <section className="login-form__section">
          <div className="login-form__container">
            <h1 className="login-form__section--title">
              <Trans i18nKey="login.title" components={{ br: <br /> }} />
            </h1>
            <span className="login-form__section--subtitle">
              {t("login.subtitle")}
            </span>
            <LoginForm />

            <div>
              <p>
                <Link
                  className="login-form__forgot--password"
                  to="/forgot-password"
                >
                  {t("login.forgotPassword")}
                </Link>
              </p>

              <p>
                <Link
                  className="login-form__resend--verification"
                  to="/resend-verification"
                >
                  {t("login.needsVerification")}
                </Link>
              </p>
            </div>

            <p className="login-form__register">
              {t("login.noAccount")}{" "}
              <Link to="/register">{t("common.register")}</Link>
            </p>

            <div className="login-divider">
              <span className="login-form__google--text">
                {t("login.googleAlternative")}
              </span>
            </div>

            <GoogleLoginButton />
          </div>
        </section>
      </main>
    </PageShell>
  );
}
