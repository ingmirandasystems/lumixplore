import { LoginForm } from "../components/auth/LoginForm";
import { Link, Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return <p>Comprobando sesión...</p>;
  }

  if (error) {
    return <p>No se pudo comprobar la sesión: {error.message}</p>;
  }

  if (user) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <main>
      <h1>Inicia sesión en LumiXplore</h1>
      <LoginForm />
      <p>
        ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </main>
  );
}
