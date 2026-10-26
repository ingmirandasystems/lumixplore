import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";
import { PageShell } from "../layouts/PageShell";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import logo from "../assets/icons/lumixplore--logo.svg";
import "./ResetPasswordPage.css";
import errorIcon from "../assets/icons/error-icon.svg";
{
  /*import successIcon from "../assets/icons/success-icon.svg";*/
}
import { usePageTitle } from "../hooks/usePageTitle";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  usePageTitle(t("resetPassword.pageTitle"));

  return (
    <PageShell colors={mainBackgroundColors}>
      <div className="reset-password-page">
        <header className="reset-password-page__header">
          <Link to="/">
            <img src={logo} alt="LumiXplore" className="public-header__logo" />
          </Link>

          <div className="public-header__group">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="reset-password-page__section">
          <div className="reset-password-page__container">
            {!token ? (
              <>
                <h1 className="reset-password-page__title">
                  {t("resetPassword.incompleteTitle")}
                </h1>

                <div className="reset-password-page__error--container">
                  <img src={errorIcon} alt="" />
                  <div>
                    <p>{t("resetPassword.missingToken")}</p>

                    <Link to="/forgot-password">
                      {t("resetPassword.requestAnother")}
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="reset-password-page__title">
                  {t("resetPassword.title")}
                </h1>

                <ResetPasswordForm token={token} />
              </>
            )}
          </div>
        </main>
      </div>
    </PageShell>
  );
}
