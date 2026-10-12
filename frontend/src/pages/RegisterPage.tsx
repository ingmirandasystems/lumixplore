import { RegisterForm } from "../components/auth/RegisterForm";
import { Link, Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
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
      <h1>Crea tu cuenta en LumiXplore</h1>
      <RegisterForm />
      <p>
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </main>
  );
}
