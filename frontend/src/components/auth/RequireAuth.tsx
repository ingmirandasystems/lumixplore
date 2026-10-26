import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getCommonErrorKey } from "../../services/api";
import { PageShell } from "../../layouts/PageShell";
import { mainBackgroundColors } from "../../styles/backgroundPalettes";
import errorIcon from "../../assets/icons/error-icon.svg";
import { AppHeader } from "../layout/AppHeader";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { t } = useTranslation();
  const { user, loading, error } = useAuth();

  if (loading || error) {
    return (
      <PageShell colors={mainBackgroundColors}>
        <AppHeader />
        <main className="main-content">
          {loading ? (
            <p className="loading" role="status">
              {t("session.checking")}
            </p>
          ) : (
            <div className="auth-error__container" role="alert">
              <img src={errorIcon} alt="" />

              <div>
                <p>{t(getCommonErrorKey(error, "session.checkError"))}</p>
              </div>
            </div>
          )}
        </main>
      </PageShell>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
