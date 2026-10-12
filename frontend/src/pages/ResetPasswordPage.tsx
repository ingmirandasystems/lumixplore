import { Link, useSearchParams } from "react-router";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <main>
        <h1>Enlace incompleto</h1>
        <p>Falta el token necesario para restablecer tu contraseña.</p>
        <Link to="/forgot-password">Solicitar otro enlace</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Restablece tu contraseña</h1>
      <ResetPasswordForm token={token} />
    </main>
  );
}
