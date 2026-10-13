import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";

export function ExplorePage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
    } catch (error: unknown) {
      setLogoutError(getCommonErrorKey(error, "session.logoutError"));
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return <p>{t("session.noSession")}</p>;
  }

  return (
    <main>
      <p>{t("session.currentUser", { name: user.name })}</p>

      {logoutError && <p role="alert">{t(logoutError)}</p>}

      <button type="button" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? t("session.loggingOut") : t("session.logout")}
      </button>
    </main>
  );
}
