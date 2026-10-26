import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { verifyEmail } from "../services/auth";
import { ApiError, getCommonErrorKey } from "../services/api";
import logo from "../assets/icons/lumixplore--logo.svg";
import { mainBackgroundColors } from "../styles/backgroundPalettes";
import { PageShell } from "../layouts/PageShell";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import "./VerifyEmailPage.css";
import errorIcon from "../assets/icons/error-icon.svg";
import successIcon from "../assets/icons/success-icon.svg";
import { usePageTitle } from "../hooks/usePageTitle";

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [isSuccess, setIsSuccess] = useState(false);

  usePageTitle(t("verification.pageTitle"));

  async function handleVerify() {
    if (!token) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      await verifyEmail(token);
      setIsSuccess(true);
    } catch (error: unknown) {
      let errorKey = getCommonErrorKey(error, "verification.error");

      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_VERIFICATION_TOKEN":
            errorKey = "verification.invalidToken";
            break;
          case "VERIFICATION_TOKEN_UNAVAILABLE":
            errorKey = "verification.tokenUnavailable";
            break;
        }
      }

      setVerificationError(errorKey);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <PageShell colors={mainBackgroundColors}>
      <div className="verify-email-page">
        <header className="verify-email-page__header">
          <img src={logo} className="public-header__logo" />
          <div className="public-header__group">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="verify-email-page__section">
          <div className="verify-email-page__container">
            {!token ? (
              <>
                <h1 className="verify-email-page__title">
                  {t("verification.incompleteTitle")}
                </h1>

                <div className="verify-email-page__error--container">
                  <img src={errorIcon} alt="" />
                  <div>
                    <p>{t("verification.missingToken")}</p>
                    <Link to="/login">{t("common.backToLogin")}</Link>
                  </div>
                </div>
              </>
            ) : isSuccess ? (
              <>
                <h1 className="verify-email-page__title">
                  {t("verification.successTitle")}
                </h1>

                <div className="verify-email-page__success--container">
                  <img src={successIcon} alt="" />
                  <div>
                    <p>{t("verification.successDescription")}</p>
                    <Link to="/login">{t("common.login")}</Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="verify-email-page__title">
                  {t("verification.title")}
                </h1>
                <p className="verify-email-page__description">
                  {t("verification.description")}
                </p>

                {verificationError && (
                  <div className="verify-email-page__error--container">
                    <img src={errorIcon} alt="" />
                    <div>
                      <p role="alert">{t(verificationError)}</p>
                      <Link to="/resend-verification">
                        {t("verification.requestAnother")}
                      </Link>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="verify-email-page-btn"
                >
                  {isVerifying
                    ? t("verification.submitting")
                    : t("verification.submit")}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    </PageShell>
  );
}
