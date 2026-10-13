import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { loadGoogleIdentity } from "../../services/google";
import { ApiError, getCommonErrorKey } from "../../services/api";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;

          renderButton: (
            container: HTMLElement,
            options: {
              theme: "outline";
              size: "large";
              locale: "es" | "en";
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  const buttonRef = useRef<HTMLDivElement | null>(null);
  const { googleLogin } = useAuth();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      setIsLoggingIn(true);
      setLoginError(null);

      try {
        await googleLogin({
          credential: response.credential,
          language,
          region: "MX",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } catch (error: unknown) {
        let errorKey = getCommonErrorKey(error, "login.googleError");

        if (error instanceof ApiError) {
          switch (error.code) {
            case "INVALID_GOOGLE_LOGIN_DATA":
              errorKey = "login.googleInvalidData";
              break;
            case "INVALID_GOOGLE_CREDENTIAL":
              errorKey = "login.googleInvalidCredential";
              break;
            case "GOOGLE_EMAIL_VERIFICATION_REQUIRED":
              errorKey = "login.googleEmailVerificationRequired";
              break;
            case "GOOGLE_ACCOUNT_CONFLICT":
              errorKey = "login.googleAccountConflict";
              break;
          }
        }

        setLoginError(errorKey);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [googleLogin, language],
  );

  useEffect(() => {
    let cancelled = false;

    async function prepareButton() {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
          throw new Error("Missing Google Client ID");
        }

        await loadGoogleIdentity();

        if (cancelled) return;

        const google = window.google;
        const container = buttonRef.current;

        if (!google || !container) {
          throw new Error("Google sign-in is unavailable");
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
        });

        container.replaceChildren();

        google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          locale: language,
        });
      } catch {
        if (cancelled) return;

        setLoginError("login.googleLoadError");
      }
    }

    void prepareButton();

    return () => {
      cancelled = true;
    };
  }, [handleCredential, language]);

  return (
    <div>
      <div ref={buttonRef} hidden={isLoggingIn} />

      {isLoggingIn && <p role="status">{t("login.googleSubmitting")}</p>}

      {loginError && <p role="alert">{t(loginError)}</p>}
    </div>
  );
}
