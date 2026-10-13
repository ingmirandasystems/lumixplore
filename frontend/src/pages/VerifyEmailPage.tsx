import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { verifyEmail } from "../services/auth";
import { ApiError, getCommonErrorKey } from "../services/api";

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );
  const [isSuccess, setIsSuccess] = useState(false);

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

  if (!token) {
    return (
      <main>
        <h1>{t("verification.incompleteTitle")}</h1>
        <p>{t("verification.missingToken")}</p>
        <Link to="/login">{t("common.backToLogin")}</Link>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main>
        <h1>{t("verification.successTitle")}</h1>
        <p>{t("verification.successDescription")}</p>
        <Link to="/login">{t("common.login")}</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>{t("verification.title")}</h1>
      <p>{t("verification.description")}</p>

      {verificationError && (
        <div>
          <p role="alert">{t(verificationError)}</p>
          <Link to="/resend-verification">
            {t("verification.requestAnother")}
          </Link>
        </div>
      )}

      <button type="button" onClick={handleVerify} disabled={isVerifying}>
        {isVerifying ? t("verification.submitting") : t("verification.submit")}
      </button>
    </main>
  );
}
