import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { getCommonErrorKey } from "../../services/api";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { t } = useTranslation();
  const { user, loading, error } = useAuth();

  if (loading) {
    return <p>{t("session.checking")}</p>;
  }

  if (error) {
    return (
      <p role="alert">{t(getCommonErrorKey(error, "session.checkError"))}</p>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
