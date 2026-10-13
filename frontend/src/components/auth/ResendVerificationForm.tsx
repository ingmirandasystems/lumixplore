import { useState } from "react";
import { useTranslation } from "react-i18next";
import { resendVerification } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";

interface ResendVerificationFormProps {
  initialEmail?: string;
}

export function ResendVerificationForm({
  initialEmail = "",
}: ResendVerificationFormProps) {
  const { t } = useTranslation();

  const [email, setEmail] = useState(initialEmail);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setSendError(null);
    setIsSuccess(false);

    try {
      await resendVerification(email.trim());
      setIsSuccess(true);
    } catch (error: unknown) {
      setSendError(
        error instanceof ApiError && error.code === "INVALID_EMAIL"
          ? "common.invalidEmail"
          : getCommonErrorKey(error, "resend.error"),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="resend-email">{t("common.email")}</label>

      <input
        id="resend-email"
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

      {sendError && <p role="alert">{t(sendError)}</p>}

      {isSuccess && <p role="status">{t("resend.success")}</p>}

      <button type="submit" disabled={isSending}>
        {isSending ? t("resend.submitting") : t("resend.submit")}
      </button>
    </form>
  );
}
