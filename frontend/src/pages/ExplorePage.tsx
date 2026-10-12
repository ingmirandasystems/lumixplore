import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function ExplorePage() {
  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
    } catch (error: unknown) {
      setLogoutError(
        error instanceof Error ? error.message : "No se pudo cerrar la sesión",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return <p>No has iniciado sesión.</p>;
  }

  return (
    <main>
      <p>Usuario: {user.name}</p>

      {logoutError && <p role="alert">{logoutError}</p>}

      <button onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
    </main>
  );
}
