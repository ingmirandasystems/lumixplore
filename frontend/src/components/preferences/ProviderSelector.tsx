import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { WatchProvider } from "../../services/catalog";
import "./ProviderSelector.css";

interface ProviderSelectorProps {
  providers: WatchProvider[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

function ProviderLogo({ path }: { path: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return (
      <span
        className="provider-selector__logo provider-selector__logo--fallback"
        aria-hidden="true"
      >
        ?
      </span>
    );
  }

  return (
    <img
      className="provider-selector__logo"
      src={`https://image.tmdb.org/t/p/original${path}`}
      alt=""
      width={64}
      height={64}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function ProviderSelector({
  providers,
  selectedIds,
  onChange,
  disabled = false,
}: ProviderSelectorProps) {
  const { t } = useTranslation();
  const allSelected = selectedIds.length === 0;

  return (
    <fieldset className="provider-selector" disabled={disabled}>
      <legend>{t("preferences.platforms")}</legend>

      <p>{t("preferences.platformsDescription")}</p>

      <div className="provider-selector__grid">
        {providers.map((provider) => {
          const checked = selectedIds.includes(provider.provider_id);

          return (
            <label
              key={provider.provider_id}
              className={`preference-card${checked ? " is-selected" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  onChange(
                    event.currentTarget.checked
                      ? [...new Set([...selectedIds, provider.provider_id])]
                      : selectedIds.filter((id) => id !== provider.provider_id),
                  );
                }}
              />

              <ProviderLogo
                key={provider.logo_path}
                path={provider.logo_path}
              />

              <span>{provider.provider_name}</span>
            </label>
          );
        })}

        <label
          className={`preference-card${allSelected ? " is-selected" : ""}`}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onChange([])}
          />

          <span>{t("preferences.allPlatforms")}</span>
        </label>
      </div>
    </fieldset>
  );
}
