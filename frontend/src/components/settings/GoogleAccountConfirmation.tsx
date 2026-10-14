import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadGoogleIdentity } from "../../services/google";

interface GoogleAccountConfirmationProps {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

export function GoogleAccountConfirmation({
  onCredential,
  disabled = false,
}: GoogleAccountConfirmationProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState(false);

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
          callback: (response) => {
            if (!cancelled) {
              onCredential(response.credential);
            }
          },
        });

        container.replaceChildren();

        google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          locale: language,
        });

        setLoadError(false);
      } catch {
        if (!cancelled) {
          setLoadError(true);
        }
      }
    }

    void prepareButton();

    return () => {
      cancelled = true;
    };
  }, [language, onCredential]);

  return (
    <div>
      <div ref={buttonRef} hidden={disabled} />

      {loadError && <p role="alert">{t("login.googleLoadError")}</p>}
    </div>
  );
}
