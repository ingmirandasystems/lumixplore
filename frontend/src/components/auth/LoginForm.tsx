import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import type { LoginCredentials } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import "./LoginForm.css";
import errorIcon from "../../assets/icons/error-icon.svg";
import { FloatingInput } from "../ui/FloatingInput";

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
    <form className="login-form" onSubmit={handleSubmit}>
      <FloatingInput
        id="login-email"
        label={t("common.email")}
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

      <FloatingInput
        id="login-password"
        label={t("common.password")}
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
      {loginError && (
        <div className="login-form__error--container">
          <img src={errorIcon} alt="" />
          <div>
            <p role="alert">{t(loginError)}</p>
          </div>
        </div>
      )}

      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? t("login.submitting") : t("common.login")}
      </button>
    </form>
  );
}
