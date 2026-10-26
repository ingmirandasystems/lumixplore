import { useRef, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getCommonErrorKey } from "../services/api";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import userIcon from "../assets/icons/user.svg";
import "./ProfileSelector.css";
import myListIcon from "../assets/icons/heart.svg";
import preferencesIcon from "../assets/icons/preferences.svg";
import settingsIcon from "../assets/icons/settings.svg";

export function ProfileSelector() {
  const { t } = useTranslation();

  const { logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);

  function closeSelector() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }

    summaryRef.current?.focus();
  }

  async function handleLogout() {
    if (isLoggingOut) return;

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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current;

      if (
        details?.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <details
      ref={detailsRef}
      className="profile-selector"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeSelector();
        }
      }}
    >
      <summary ref={summaryRef} className="profile-selector__trigger">
        <div className="profile-selector__icon--container">
          <img src={userIcon} alt="" className="profile-selector__image" />
        </div>
      </summary>

      <nav
        className="profile-selector__container"
        aria-label={t("navigation.main")}
      >
        <div className="profile-selector__options">
          <div className="profile-selector__options">
            <NavLink
              to="/watchlist"
              className={({ isActive }) =>
                isActive
                  ? `profile-selector__option is-active`
                  : `profile-selector__option`
              }
              onClick={closeSelector}
            >
              <img src={myListIcon} alt="" className="profile-selector__icon" />
              {t("watchlist.heading")}
            </NavLink>

            <NavLink
              to="/preferences"
              className={({ isActive }) =>
                isActive
                  ? `profile-selector__option is-active`
                  : `profile-selector__option`
              }
              onClick={closeSelector}
            >
              <img
                src={preferencesIcon}
                alt=""
                className="profile-selector__icon"
              />
              {t("navigation.preferences")}
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive
                  ? `profile-selector__option is-active`
                  : `profile-selector__option`
              }
              onClick={closeSelector}
            >
              <img
                src={settingsIcon}
                alt=""
                className="profile-selector__icon"
              />
              {t("navigation.settings")}
            </NavLink>
          </div>

          <div className="profile-selector__divider"></div>

          <div className="profile-selector__logout--container">
            <button
              type="button"
              className="profile-selector__option profile-selector__logout"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? t("session.loggingOut") : t("session.logout")}
            </button>

            {logoutError && (
              <p className="profile-selector__error" role="alert">
                {t(logoutError)}
              </p>
            )}
          </div>
        </div>
      </nav>
    </details>
  );
}
