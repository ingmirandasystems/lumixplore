import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { loadGoogleIdentity } from "../../services/google";

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
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleLoginButton() {
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
          language: "es",
          region: "MX",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } catch (error: unknown) {
        setLoginError(
          error instanceof Error
            ? error.message
            : "No se pudo iniciar sesión con Google",
        );
      } finally {
        setIsLoggingIn(false);
      }
    },
    [googleLogin],
  );

  useEffect(() => {
    let cancelled = false;

    async function prepareButton() {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
          throw new Error("Falta configurar el Client ID de Google");
        }

        await loadGoogleIdentity();

        if (cancelled) return;

        const google = window.google;
        const container = buttonRef.current;

        if (!google || !container) {
          throw new Error("No se pudo preparar el botón de Google");
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
        });

        container.replaceChildren();

        google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
        });
      } catch (error: unknown) {
        if (cancelled) return;

        setLoginError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el acceso con Google",
        );
      }
    }

    void prepareButton();

    return () => {
      cancelled = true;
    };
  }, [handleCredential]);

  return (
    <div>
      <div ref={buttonRef} hidden={isLoggingIn} />

      {isLoggingIn && <p role="status">Iniciando sesión con Google...</p>}

      {loginError && <p role="alert">{loginError}</p>}
    </div>
  );
}
