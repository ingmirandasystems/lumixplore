import { useState } from "react";
import { useTranslation } from "react-i18next";
import { forgotPassword } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";

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
    <form onSubmit={handleSubmit}>
      <label htmlFor="forgot-email">{t("common.email")}</label>

      <input
        id="forgot-email"
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

      {requestError && <p role="alert">{t(requestError)}</p>}

      {isSuccess && <p role="status">{t("forgotPassword.success")}</p>}

      <button type="submit" disabled={isSending}>
        {isSending
          ? t("forgotPassword.submitting")
          : t("forgotPassword.submit")}
      </button>
    </form>
  );
}
