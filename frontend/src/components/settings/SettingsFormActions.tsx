import { useTranslation } from "react-i18next";
import refreshIcon from "../../assets/icons/retry.svg";
import "./SettingsForms.css";

interface SettingsFormActionsProps {
  busy: boolean;
  onCancel: () => void;
  submitLabel: string;
  disabled?: boolean;
  danger?: boolean;
}

export function SettingsFormActions({
  busy,
  onCancel,
  submitLabel,
  disabled = false,
  danger = false,
}: SettingsFormActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="settings-form__actions">
      <button
        type="button"
        className="settings-form__cancel"
        disabled={busy}
        onClick={onCancel}
      >
        {t("settings.ui.cancel")}
      </button>

      <button
        type="submit"
        className={`settings-form__submit${danger ? " settings-form__submit--danger" : ""}`}
        disabled={busy || disabled}
        aria-busy={busy}
      >
        {!danger && <img src={refreshIcon} alt="" />}
        <span>{submitLabel}</span>
      </button>
    </div>
  );
}
