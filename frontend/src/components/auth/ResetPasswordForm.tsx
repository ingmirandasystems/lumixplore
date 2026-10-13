import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { resetPassword } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);

    if (password !== confirmPassword) {
      setResetError("resetPassword.passwordMismatch");
      return;
    }

    setIsResetting(true);

    try {
      await resetPassword({ token, password });
      setIsSuccess(true);
    } catch (error: unknown) {
      let errorKey = getCommonErrorKey(error, "resetPassword.error");

      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_PASSWORD_RESET_DATA":
            errorKey = "resetPassword.invalidData";
            break;
          case "PASSWORD_RESET_TOKEN_UNAVAILABLE":
            errorKey = "resetPassword.tokenUnavailable";
            break;
        }
      }

      setResetError(errorKey);
    } finally {
      setIsResetting(false);
    }
  }

  if (isSuccess) {
    return (
      <div role="status">
        <h2>{t("resetPassword.successTitle")}</h2>
        <p>{t("resetPassword.successDescription")}</p>
        <Link to="/login">{t("common.login")}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="reset-password">{t("resetPassword.newPassword")}</label>

      <input
        id="reset-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={password}
        onChange={(event) => {
          setPassword(event.currentTarget.value);
        }}
      />

      <label htmlFor="reset-confirm-password">
        {t("common.confirmPassword")}
      </label>

      <input
        id="reset-confirm-password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(event.currentTarget.value);
        }}
      />

      {resetError && <p role="alert">{t(resetError)}</p>}

      <button type="submit" disabled={isResetting}>
        {isResetting
          ? t("resetPassword.submitting")
          : t("resetPassword.submit")}
      </button>
    </form>
  );
}
