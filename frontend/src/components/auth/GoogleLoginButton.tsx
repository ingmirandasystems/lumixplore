import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { loadGoogleIdentity } from "../../services/google";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { RegionSelect } from "../RegionSelect";
import googleIcon from "../../assets/icons/google.svg";
import "./GoogleLoginButton.css";

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
              shape: "pill";
              width: string;
            },
          ) => void;
        };
      };
    };
  }
}

interface GoogleCodeResponse {
  code?: string;
  error?: string;
}

interface GoogleCodeClient {
  requestCode: () => void;
}

interface GoogleOAuth2 {
  initCodeClient: (options: {
    client_id: string;
    scope: string;
    ux_mode: "popup";
    select_account: boolean;
    callback: (response: GoogleCodeResponse) => void;
    error_callback: (error: { type: string }) => void;
  }) => GoogleCodeClient;
}

export function GoogleLoginButton() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const { googleLogin } = useAuth();

  const clientRef = useRef<GoogleCodeClient | null>(null);

  const [region, setRegion] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleCode = useCallback(
    async (response: GoogleCodeResponse) => {
      if (response.error || !response.code) {
        setLoginError("login.googleError");
        setIsLoggingIn(false);
        return;
      }

      if (!region) {
        setLoginError("region.unsupported");
        setIsLoggingIn(false);
        return;
      }

      try {
        await googleLogin({
          code: response.code,
          language,
          region,
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
            case "UNSUPPORTED_REGION":
              errorKey = "region.unsupported";
              break;
          }
        }

        setLoginError(errorKey);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [googleLogin, language, region],
  );

  useEffect(() => {
    let cancelled = false;

    clientRef.current = null;

    async function prepareGoogle() {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
          throw new Error("Missing Google Client ID");
        }

        await loadGoogleIdentity();

        if (cancelled) return;

        setIsReady(false);

        const accounts = window.google?.accounts as
          | { oauth2?: GoogleOAuth2 }
          | undefined;

        if (!accounts?.oauth2) {
          throw new Error("Google sign-in is unavailable");
        }

        clientRef.current = accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          select_account: true,

          callback: (response) => {
            if (!cancelled) {
              void handleCode(response);
            }
          },

          error_callback: (error) => {
            if (cancelled) return;

            setIsLoggingIn(false);

            // Cerrar la ventana voluntariamente no es un error de login.
            if (error.type !== "popup_closed") {
              setLoginError("login.googleError");
            }
          },
        });

        setIsReady(true);
      } catch {
        if (!cancelled) {
          setLoginError("login.googleLoadError");
        }
      }
    }

    void prepareGoogle();

    return () => {
      cancelled = true;
      clientRef.current = null;
    };
  }, [handleCode]);

  function handleGoogleClick() {
    if (!region || !isReady || isLoggingIn || !clientRef.current) {
      return;
    }

    setLoginError(null);
    setIsLoggingIn(true);

    try {
      clientRef.current.requestCode();
    } catch {
      setIsLoggingIn(false);
      setLoginError("login.googleError");
    }
  }

  return (
    <div className="google-login">
      <RegionSelect
        value={region}
        onChange={setRegion}
        disabled={isLoggingIn}
      />

      <button
        type="button"
        className="google-custom-button"
        disabled={!region || !isReady || isLoggingIn}
        onClick={handleGoogleClick}
        aria-busy={isLoggingIn}
      >
        <img src={googleIcon} alt="" className="google-custom-button__icon" />
        {isLoggingIn ? t("login.googleSubmitting") : t("login.googleContinue")}
      </button>

      {loginError && <p role="alert">{t(loginError)}</p>}
    </div>
  );
}
