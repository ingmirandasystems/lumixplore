import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  getCurrentUser,
  logout as logoutRequest,
  login as loginRequest,
  googleLogin as googleLoginRequest,
} from "../services/auth";
import type {
  AuthUser,
  LoginCredentials,
  GoogleLoginData,
} from "../services/auth";
import { AuthContext } from "../contexts/AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setError(null);
      })
      .catch((error: unknown) => {
        setUser(null);
        setError(
          error instanceof Error
            ? error
            : new Error("No se pudo comprobar la sesión"),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function logout(): Promise<void> {
    await logoutRequest();
    setUser(null);
    setError(null);
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    await loginRequest(credentials);

    const currentUser = await getCurrentUser();

    if (currentUser === null) {
      throw new Error("No se pudo confirmar la sesión después del login");
    }

    setUser(currentUser);
    setError(null);
  }

  async function googleLogin(data: GoogleLoginData): Promise<void> {
    await googleLoginRequest(data);

    const currentUser = await getCurrentUser();

    if (currentUser === null) {
      throw new Error("No se pudo confirmar la sesión con Google");
    }

    setUser(currentUser);
    setError(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, logout, login, googleLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}
