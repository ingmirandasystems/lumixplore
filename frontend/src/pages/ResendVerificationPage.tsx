import { Link, useLocation } from "react-router";
import { ResendVerificationForm } from "../components/auth/ResendVerificationForm";

export function ResendVerificationPage() {
  const location = useLocation();
  const state: unknown = location.state;

  const initialEmail =
    typeof state === "object" &&
    state !== null &&
    "email" in state &&
    typeof state.email === "string"
      ? state.email
      : "";

  return (
    <main>
      <h1>Reenviar verificación</h1>
      <p>Escribe el correo con el que creaste tu cuenta.</p>

      <ResendVerificationForm initialEmail={initialEmail} />

      <Link to="/login">Volver al inicio de sesión</Link>
    </main>
  );
}
