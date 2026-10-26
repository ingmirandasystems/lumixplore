import { useRef, useEffect } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { moodIds } from "../../services/moods";
import "./MoodSelector.css";
import laughIcon from "../../assets/icons/happy.svg";
import feelIcon from "../../assets/icons/sad.svg";
import tensionIcon from "../../assets/icons/horror.svg";
import adrenalineIcon from "../../assets/icons/adrenaline.svg";
import escapeIcon from "../../assets/icons/fantasy.svg";
import intenseIcon from "../../assets/icons/intense.svg";

const moodIcons: Record<(typeof moodIds)[number], string> = {
  laugh: laughIcon,
  feel: feelIcon,
  tension: tensionIcon,
  adrenaline: adrenalineIcon,
  escape: escapeIcon,
  intense: intenseIcon,
};

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

      <nav
        className="mood-selector__container"
        aria-label={t("moods.selector")}
      >
        <div className="mood-selector__options">
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
              <img
                src={moodIcons[mood]}
                alt=""
                className="mood-selector__icon"
              />
              {t(`moods.options.${mood}`)}
            </NavLink>
          ))}
        </div>
      </nav>
    </details>
  );
}
