import { useState } from "react";
import { Link } from "react-router";
import { resetPassword } from "../../services/auth";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);

    if (password !== confirmPassword) {
      setResetError("Las contraseñas no coinciden.");
      return;
    }

    setIsResetting(true);

    try {
      await resetPassword({ token, password });
      setIsSuccess(true);
    } catch (error: unknown) {
      setResetError(
        error instanceof Error
          ? error.message
          : "No se pudo restablecer la contraseña",
      );
    } finally {
      setIsResetting(false);
    }
  }

  if (isSuccess) {
    return (
      <div role="status">
        <h2>Contraseña actualizada</h2>
        <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <Link to="/login">Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="reset-password">Nueva contraseña</label>

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

      <label htmlFor="reset-confirm-password">Confirmar contraseña</label>

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

      {resetError && <p role="alert">{resetError}</p>}

      <button type="submit" disabled={isResetting}>
        {isResetting ? "Actualizando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
