import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading, error } = useAuth();

  if (loading) {
    return <p>Comprobando sesión...</p>;
  }

  if (error) {
    return <p>No se pudo comprobar la sesión: {error.message}</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
