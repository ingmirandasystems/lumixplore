import { useState } from "react";
import { resendVerification } from "../../services/auth";

interface ResendVerificationFormProps {
  initialEmail?: string;
}

export function ResendVerificationForm({
  initialEmail = "",
}: ResendVerificationFormProps) {
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
        error instanceof Error
          ? error.message
          : "No se pudo solicitar el correo de verificación",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="resend-email">Correo electrónico</label>

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

      {sendError && <p role="alert">{sendError}</p>}

      {isSuccess && (
        <p role="status">
          Si existe una cuenta pendiente de verificación con ese correo,
          recibirás las instrucciones para verificarla.
        </p>
      )}

      <button type="submit" disabled={isSending}>
        {isSending ? "Solicitando..." : "Reenviar verificación"}
      </button>
    </form>
  );
}
