import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { resetPassword } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { FloatingInput } from "../ui/FloatingInput";
import "./ResetPasswordForm.css";
import errorIcon from "../../assets/icons/error-icon.svg";
import successIcon from "../../assets/icons/success-icon.svg";

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
      <div role="status" className="reset-password-form__success--container">
        <img src={successIcon} alt="" />
        <div>
          <h2>{t("resetPassword.successTitle")}</h2>
          <p>{t("resetPassword.successDescription")}</p>
          <Link to="/login">{t("common.login")}</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="reset-password-form" onSubmit={handleSubmit}>
      <FloatingInput
        id="reset-password"
        label={t("resetPassword.newPassword")}
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

      <FloatingInput
        id="reset-confirm-password"
        label={t("common.confirmPassword")}
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

      {resetError && (
        <div className="reset-password-form__error--container">
          <img src={errorIcon} alt="" />
          <div>
            <p role="alert">{t(resetError)}</p>
          </div>
        </div>
      )}

      <button type="submit" disabled={isResetting}>
        {isResetting
          ? t("resetPassword.submitting")
          : t("resetPassword.submit")}
      </button>
    </form>
  );
}
