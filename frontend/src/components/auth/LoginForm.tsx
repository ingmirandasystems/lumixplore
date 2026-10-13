import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import type { LoginCredentials } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";

export function LoginForm() {
  const { t } = useTranslation();
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
      let errorKey = getCommonErrorKey(error, "login.error");

      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_LOGIN_DATA":
            errorKey = "login.invalidData";
            break;
          case "INVALID_CREDENTIALS":
            errorKey = "login.invalidCredentials";
            break;
          case "EMAIL_NOT_VERIFIED":
            errorKey = "login.emailNotVerified";
            break;
        }
      }

      setLoginError(errorKey);
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="login-email">{t("common.email")}</label>

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

      <label htmlFor="login-password">{t("common.password")}</label>

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

      {loginError && <p role="alert">{t(loginError)}</p>}

      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? t("login.submitting") : t("common.login")}
      </button>
    </form>
  );
}
