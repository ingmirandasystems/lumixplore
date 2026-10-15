import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CatalogTitle } from "../../services/titles";
import { TitleProviderLogo } from "./TitleProviderLogo";

interface TitleWatchAvailabilityProps {
  availability: CatalogTitle["watchAvailability"];
}

export function TitleWatchAvailability({
  availability,
}: TitleWatchAvailabilityProps) {
  const { t } = useTranslation();
  const panelId = useId();
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

  return (
    <div className="title-watch">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        {t("title.whereToWatch")}
      </button>

      <div
        id={panelId}
        className="title-watch__panel"
        hidden={!isOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            event.currentTarget.parentElement?.querySelector("button")?.focus();
          }
        }}
      >
        <h2>{t("title.whereToWatch")}</h2>
        <p>{t("title.watchRegion", { region: availability.region })}</p>

        {groups.length === 0 ? (
          <p>{t("title.watchEmpty")}</p>
        ) : (
          groups.map((group) => (
            <section key={group.id} className="title-watch__group">
              <h3>{group.label}</h3>

              <ul>
                {group.providers.map((provider) => (
                  <li key={provider.id}>
                    <TitleProviderLogo
                      key={provider.logoPath}
                      path={provider.logoPath}
                    />
                    <span>{provider.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        {availability.link && (
          <a href={availability.link} target="_blank" rel="noopener noreferrer">
            {t("title.watchMore")}
          </a>
        )}

        <p>{t("title.watchAttribution")}</p>
      </div>
    </div>
  );
}
