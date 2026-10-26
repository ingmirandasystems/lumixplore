import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getWatchRegions } from "../services/catalog";
import type { WatchRegion } from "../services/catalog";
import { getCommonErrorKey } from "../services/api";
import location from "../assets/icons/map-pin.svg";
import "./RegionSelect.css";

interface RegionSelectProps {
  value: string;
  onChange: (region: string) => void;
  disabled?: boolean;
}

export function RegionSelect({
  value,
  onChange,
  disabled = false,
}: RegionSelectProps) {
  const { t, i18n } = useTranslation();

  const [regions, setRegions] = useState<WatchRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRegions() {
      try {
        const result = await getWatchRegions();

        if (cancelled) return;

        setRegions(result);
      } catch (error: unknown) {
        if (cancelled) return;

        setLoadError(getCommonErrorKey(error, "region.loadError"));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRegions();

    return () => {
      cancelled = true;
    };
  }, []);

  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const displayNames = new Intl.DisplayNames([language], {
    type: "region",
  });

  const options = regions
    .map((region) => ({
      code: region.iso_3166_1,
      name: displayNames.of(region.iso_3166_1) ?? region.english_name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language));

  const selectedRegion = options.find((region) => region.code === value);

  const visibleText = isLoading
    ? t("region.loading")
    : (selectedRegion?.name ?? t("region.placeholder"));

  const isDisabled = disabled || isLoading || loadError !== null;

  return (
    <div className="region-select__container">
      <label className="region-select__label">
        <img src={location} alt="" className="region-select__location--icon" />

        <span className="region-select__text" aria-hidden="true">
          {visibleText}
        </span>

        <span className="region-select__arrow" aria-hidden="true">
          ▾
        </span>

        <select
          className="region-select__select"
          aria-label={t("region.placeholder")}
          value={value}
          required
          disabled={isDisabled}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
        >
          <option value="" disabled>
            {isLoading ? t("region.loading") : t("region.placeholder")}
          </option>

          {options.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
      </label>

      {loadError && <p role="alert">{t(loadError)}</p>}
    </div>
  );
}
