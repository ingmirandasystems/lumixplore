import { useState } from "react";
import { useTranslation } from "react-i18next";
import { resendVerification } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { FloatingInput } from "../ui/FloatingInput";
import "./ResendverificationForm.css";
import errorIcon from "../../assets/icons/error-icon.svg";
import successIcon from "../../assets/icons/success-icon.svg";

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
    <form className="resendVerification-form" onSubmit={handleSubmit}>
      <FloatingInput
        id="resend-email"
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

      {sendError && (
        <div className="resendVerification-form__error--container">
          <img src={errorIcon} alt="" />
          <div>
            <p role="alert">{t(sendError)}</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="resendVerification-form__success--container">
          <img src={successIcon} alt="" />
          <div>
            <p role="status">{t("resend.success")}</p>
          </div>
        </div>
      )}

      <button type="submit" disabled={isSending}>
        {isSending ? t("resend.submitting") : t("resend.submit")}
      </button>
    </form>
  );
}
