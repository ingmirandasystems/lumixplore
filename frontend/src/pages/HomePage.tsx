import { Link, Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function HomePage() {
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
      <h1>Bienvenido a LumiXplore</h1>
      <p>Descubre películas y series para tu próximo momento de cine.</p>

      <Link to="/login">Iniciar sesión</Link>
      <Link to="/register">Crear cuenta</Link>
    </main>
  );
}
