import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { LoginCredentials } from "../../services/auth";

export function LoginForm() {
  const { login } = useAuth();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await login(credentials);
    } catch (error: unknown) {
      setLoginError(
        error instanceof Error ? error.message : "No se pudo iniciar sesión",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="login-email">Correo electrónico</label>

      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={credentials.email}
        onChange={(event) => {
          const newEmail = event.currentTarget.value;

          setCredentials((previous) => ({
            ...previous,
            email: newEmail,
          }));
        }}
      />

      <label htmlFor="login-password">Contraseña</label>

      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={credentials.password}
        onChange={(event) => {
          const newPassword = event.currentTarget.value;

          setCredentials((previous) => ({
            ...previous,
            password: newPassword,
          }));
        }}
      />

      {loginError && <p role="alert">{loginError}</p>}

      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
