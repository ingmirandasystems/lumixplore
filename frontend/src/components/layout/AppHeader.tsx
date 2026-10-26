import { useLayoutEffect, useRef, useState } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { SearchForm } from "../search/SearchForm";
import { MoodSelector } from "../moods/MoodSelector";
import { ProfileSelector } from "../ProfileSelector";
import logo from "../../assets/icons/lumixplore--logo.svg";
import searchIcon from "../../assets/icons/search.svg";
import "./AppHeader.css";

export function AppHeader() {
  const { t } = useTranslation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);

  function closeSearch() {
    setIsSearchOpen(false);
    searchTriggerRef.current?.focus();
  }

  const headerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;

    if (!header) return;

    function updateHeight() {
      if (!header) return;

      document.documentElement.style.setProperty(
        "--app-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    }

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--app-header-height");
    };
  }, []);

  return (
    <header ref={headerRef} className="app-header">
      <div className="app-header__content" inert={isSearchOpen}>
        <NavLink to="/explore" aria-label="LumiXplore">
          <img src={logo} alt="" className="header__logo" />
        </NavLink>

        <div className="actions-section">
          <MoodSelector />

          <div className="separator-header">
            <div className="app-header__desktop-search">
              <SearchForm />
            </div>

            <button
              ref={searchTriggerRef}
              type="button"
              className="app-header__search-toggle"
              aria-label={t("search.open")}
              aria-expanded={isSearchOpen}
              aria-controls="app-header-mobile-search"
              onClick={() => setIsSearchOpen(true)}
            >
              <img src={searchIcon} alt="" />
            </button>

            <ProfileSelector />
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div
          id="app-header-mobile-search"
          className="app-header__search-overlay"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeSearch();
            }
          }}
        >
          <button
            type="button"
            className="app-header__search-back"
            aria-label={t("search.back")}
            onClick={closeSearch}
          >
            <span aria-hidden="true">←</span>
          </button>

          <SearchForm autoFocus onSearch={closeSearch} />
        </div>
      )}
    </header>
  );
}
