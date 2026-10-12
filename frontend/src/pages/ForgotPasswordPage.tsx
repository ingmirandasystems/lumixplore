import { Link } from "react-router";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";

export function ForgotPasswordPage() {
  return (
    <main>
      <h1>Recupera tu contraseña</h1>
      <p>Escribe el correo con el que creaste tu cuenta.</p>

      <ForgotPasswordForm />

      <Link to="/login">Volver al inicio de sesión</Link>
    </main>
  );
}
