import { useTranslation } from "react-i18next";
import type { ContentType } from "../../services/preferences";

interface ContentTypeSelectorProps {
  value: ContentType;
  onChange: (value: ContentType) => void;
  disabled?: boolean;
}

export function ContentTypeSelector({
  value,
  onChange,
  disabled = false,
}: ContentTypeSelectorProps) {
  const { t } = useTranslation();

  const choices = [
    { value: "movie", label: "preferences.movies" },
    { value: "tv", label: "preferences.series" },
    { value: "both", label: "preferences.both" },
  ] as const;

  return (
    <fieldset disabled={disabled}>
      <legend>{t("preferences.contentType")}</legend>

      {choices.map((choice) => (
        <label
          key={choice.value}
          className={`preference-card${value === choice.value ? " is-selected" : ""}`}
        >
          <input
            type="radio"
            name="contentType"
            value={choice.value}
            checked={value === choice.value}
            onChange={() => onChange(choice.value)}
          />
          {t(choice.label)}
        </label>
      ))}
    </fieldset>
  );
}
