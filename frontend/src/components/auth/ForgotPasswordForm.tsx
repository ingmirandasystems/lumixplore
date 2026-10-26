import { useState } from "react";
import { useTranslation } from "react-i18next";
import { forgotPassword } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { FloatingInput } from "../ui/FloatingInput";
import errorIcon from "../../assets/icons/error-icon.svg";
import successIcon from "../../assets/icons/success-icon.svg";
import "./ForgotPasswordForm.css";

export function ForgotPasswordForm() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setRequestError(null);
    setIsSuccess(false);

    try {
      await forgotPassword(email.trim());
      setIsSuccess(true);
    } catch (error: unknown) {
      setRequestError(
        error instanceof ApiError && error.code === "INVALID_EMAIL"
          ? "common.invalidEmail"
          : getCommonErrorKey(error, "forgotPassword.error"),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="forgotPassword-form" onSubmit={handleSubmit}>
      <FloatingInput
        id="forgot-email"
        label={t("common.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        value={email}
        onChange={(event) => {
          setEmail(event.currentTarget.value);
        }}
      />

      {requestError && (
        <div className="forgotPassword-form__error--container">
          <img src={errorIcon} alt="" />
          <div>
            <p role="alert">{t(requestError)}</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="forgotPassword-form__success--container">
          <img src={successIcon} alt="" />
          <div>
            <p role="status">{t("forgotPassword.success")}</p>
          </div>
        </div>
      )}

      <button type="submit" disabled={isSending}>
        {isSending
          ? t("forgotPassword.submitting")
          : t("forgotPassword.submit")}
      </button>
    </form>
  );
}
