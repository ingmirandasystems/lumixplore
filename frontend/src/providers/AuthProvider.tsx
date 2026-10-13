import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  getCurrentUser,
  logout as logoutRequest,
  login as loginRequest,
  googleLogin as googleLoginRequest,
  updateLanguage as updateLanguageRequest,
} from "../services/auth";
import type {
  AuthUser,
  LoginCredentials,
  GoogleLoginData,
} from "../services/auth";
import { AuthContext } from "../contexts/AuthContext";
import i18n from "../i18n";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const accountLanguage = user?.language;

  useEffect(() => {
    if (!accountLanguage) return;

    localStorage.setItem("lumixplore.language", accountLanguage);
    void i18n.changeLanguage(accountLanguage);
  }, [accountLanguage]);

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

  async function updateLanguage(language: "es" | "en"): Promise<void> {
    const updatedUser = await updateLanguageRequest(language);
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        logout,
        login,
        googleLogin,
        updateLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
