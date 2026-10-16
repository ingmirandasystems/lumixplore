import { useRef } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { moodIds } from "../../services/moods";

export function MoodSelector() {
  const { t } = useTranslation();
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const summaryRef = useRef<HTMLElement | null>(null);

  function closeSelector() {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }

    summaryRef.current?.focus();
  }

  return (
    <details
      ref={detailsRef}
      className="mood-selector"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeSelector();
        }
      }}
    >
      <summary ref={summaryRef} className="mood-selector__trigger">
        {t("moods.selector")}
      </summary>

      <nav className="mood-selector__options" aria-label={t("moods.selector")}>
        {moodIds.map((mood) => (
          <NavLink
            key={mood}
            to={`/moods/${mood}`}
            className={({ isActive }) =>
              isActive
                ? `mood-selector__option mood-selector__option--${mood} is-active`
                : `mood-selector__option mood-selector__option--${mood}`
            }
            onClick={closeSelector}
          >
            {t(`moods.options.${mood}`)}
          </NavLink>
        ))}
      </nav>
    </details>
  );
}
