import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogTitle } from "../../services/titles";
import { TitleProviderLogo } from "./TitleProviderLogo";
import playIcon from "../../assets/icons/play.svg";
import "./TitleWatchAvailability.css";

interface TitleWatchAvailabilityProps {
  availability: CatalogTitle["watchAvailability"];
}

export function TitleWatchAvailability({
  availability,
}: TitleWatchAvailabilityProps) {
  const { t } = useTranslation();
  const panelId = useId();
  const headingId = useId();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const groups = [
    {
      id: "subscription",
      label: t("title.watchSubscription"),
      providers: availability.subscription,
    },
    {
      id: "rent",
      label: t("title.watchRent"),
      providers: availability.rent,
    },
    {
      id: "buy",
      label: t("title.watchBuy"),
      providers: availability.buy,
    },
    {
      id: "free",
      label: t("title.watchFree"),
      providers: availability.free,
    },
    {
      id: "ads",
      label: t("title.watchAds"),
      providers: availability.ads,
    },
  ].filter((group) => group.providers.length > 0);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="title-watch"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="title-watch__trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <img src={playIcon} alt="" />
        <span>{t("title.whereToWatch")}</span>
      </button>

      <div
        id={panelId}
        className="title-watch__panel"
        role="region"
        aria-labelledby={headingId}
        hidden={!isOpen}
      >
        <header className="title-watch__panel-header">
          <h2 id={headingId}>{t("title.whereToWatch")}</h2>

          <p>{t("title.watchRegion", { region: availability.region })}</p>
        </header>

        {groups.length === 0 ? (
          <p className="title-watch__empty">{t("title.watchEmpty")}</p>
        ) : (
          <div className="title-watch__groups">
            {groups.map((group) => (
              <section key={group.id} className="title-watch__group">
                <h3>{group.label}</h3>

                <ul className="title-watch__providers">
                  {group.providers.map((provider) => (
                    <li key={provider.id} className="title-watch__provider">
                      <div
                        className="title-watch__provider-logo"
                        aria-hidden="true"
                      >
                        <TitleProviderLogo
                          key={provider.logoPath}
                          path={provider.logoPath}
                        />
                      </div>

                      <span>{provider.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <footer className="title-watch__panel-footer">
          {availability.link && (
            <a
              href={availability.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("title.watchMore")}
            </a>
          )}

          <p>{t("title.watchAttribution")}</p>
        </footer>
      </div>
    </div>
  );
}
