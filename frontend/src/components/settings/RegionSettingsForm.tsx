import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RegionSelect } from "../RegionSelect";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";

interface RegionSettingsFormProps {
  initialRegion: string;
}

export function RegionSettingsForm({ initialRegion }: RegionSettingsFormProps) {
  const { t } = useTranslation();
  const { updateRegion } = useAuth();

  const [region, setRegion] = useState(initialRegion);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setIsSuccess(false);

    if (!region) {
      setSaveError("region.unsupported");
      return;
    }

    setIsSaving(true);

    try {
      await updateRegion(region);
      setIsSuccess(true);
    } catch (error: unknown) {
      setSaveError(
        error instanceof ApiError && error.code === "UNSUPPORTED_REGION"
          ? "region.unsupported"
          : getCommonErrorKey(error, "settings.regionError"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <RegionSelect
        value={region}
        disabled={isSaving}
        onChange={(value) => {
          setRegion(value);
          setIsSuccess(false);
        }}
      />

      {saveError && <p role="alert">{t(saveError)}</p>}
      {isSuccess && <p role="status">{t("settings.regionSaved")}</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? t("settings.saving") : t("settings.saveRegion")}
      </button>
    </form>
  );
}
