import { useState } from "react";
import { forgotPassword } from "../../services/auth";

export function ForgotPasswordForm() {
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
        error instanceof Error
          ? error.message
          : "No se pudo solicitar la recuperación de contraseña",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="forgot-email">Correo electrónico</label>

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

      {requestError && <p role="alert">{requestError}</p>}

      {isSuccess && (
        <p role="status">
          Si existe una cuenta con ese correo que permita recuperar la
          contraseña, recibirás las instrucciones.
        </p>
      )}

      <button type="submit" disabled={isSending}>
        {isSending ? "Solicitando..." : "Recuperar contraseña"}
      </button>
    </form>
  );
}
