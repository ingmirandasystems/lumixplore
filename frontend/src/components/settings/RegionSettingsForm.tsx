import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { RegionSelect } from "../RegionSelect";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { SettingsFormActions } from "./SettingsFormActions";

interface RegionSettingsFormProps {
  initialRegion: string;
  onCancel: () => void;
  onSuccess: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function RegionSettingsForm({
  initialRegion,
  onCancel,
  onSuccess,
  onBusyChange,
}: RegionSettingsFormProps) {
  const { t } = useTranslation();
  const { updateRegion } = useAuth();

  const [region, setRegion] = useState(initialRegion);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    setSaveError(null);

    if (!region) {
      setSaveError("region.unsupported");
      return;
    }

    setIsSaving(true);
    onBusyChange(true);

    try {
      await updateRegion(region);
    } catch (error: unknown) {
      setSaveError(
        error instanceof ApiError && error.code === "UNSUPPORTED_REGION"
          ? "region.unsupported"
          : getCommonErrorKey(error, "settings.regionError"),
      );

      return;
    } finally {
      setIsSaving(false);
      onBusyChange(false);
    }

    onSuccess();
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <RegionSelect value={region} disabled={isSaving} onChange={setRegion} />

      {saveError && (
        <p className="settings-form__error" role="alert">
          {t(saveError)}
        </p>
      )}

      <SettingsFormActions
        busy={isSaving}
        disabled={!region || region === initialRegion}
        onCancel={onCancel}
        submitLabel={
          isSaving ? t("settings.saving") : t("settings.ui.saveChanges")
        }
      />
    </form>
  );
}
