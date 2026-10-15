import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { SearchForm } from "../search/SearchForm";

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <NavLink to="/explore" className="app-header__brand">
        LumiXplore
      </NavLink>

      <SearchForm />

      <nav aria-label={t("navigation.main")}>
        <NavLink to="/watchlist">{t("watchlist.heading")}</NavLink>
        <NavLink to="/preferences">{t("navigation.preferences")}</NavLink>
        <NavLink to="/settings">{t("navigation.settings")}</NavLink>
      </nav>
    </header>
  );
}
