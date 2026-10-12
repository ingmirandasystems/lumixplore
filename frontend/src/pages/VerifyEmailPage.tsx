import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { verifyEmail } from "../services/auth";

export function VerifyEmailPage() {
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
      setVerificationError(
        error instanceof Error
          ? error.message
          : "No se pudo verificar el correo",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  if (!token) {
    return (
      <main>
        <h1>Enlace incompleto</h1>
        <p>Falta el token necesario para verificar tu correo.</p>
        <Link to="/login">Ir al inicio de sesión</Link>
      </main>
    );
  }

  if (isSuccess) {
    return (
      <main>
        <h1>Correo verificado</h1>
        <p>Ya puedes iniciar sesión en tu cuenta.</p>
        <Link to="/login">Iniciar sesión</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Verifica tu correo</h1>
      <p>Confirma la verificación de tu correo electrónico.</p>

      {verificationError && (
        <div>
          <p role="alert">{verificationError}</p>
          <Link to="/resend-verification">
            Solicitar otro correo de verificación
          </Link>
        </div>
      )}

      <button type="button" onClick={handleVerify} disabled={isVerifying}>
        {isVerifying ? "Verificando..." : "Verificar mi correo"}
      </button>
    </main>
  );
}
