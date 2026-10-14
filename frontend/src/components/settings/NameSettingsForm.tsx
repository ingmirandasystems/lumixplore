import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";

interface NameSettingsFormProps {
  initialName: string;
}

export function NameSettingsForm({ initialName }: NameSettingsFormProps) {
  const { t } = useTranslation();
  const { updateName } = useAuth();

  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setIsSuccess(false);

    if (!name.trim()) {
      setSaveError("settings.invalidName");
      return;
    }

    setIsSaving(true);

    try {
      await updateName(name.trim());
      setIsSuccess(true);
    } catch (error: unknown) {
      let errorKey = getCommonErrorKey(error, "settings.nameError");

      if (error instanceof ApiError) {
        if (error.code === "INVALID_NAME") {
          errorKey = "settings.invalidName";
        } else if (error.code === "NAME_EDIT_NOT_ALLOWED") {
          errorKey = "settings.nameNotAllowed";
        }
      }

      setSaveError(errorKey);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="settings-name">{t("common.name")}</label>

      <input
        id="settings-name"
        name="name"
        autoComplete="given-name"
        required
        maxLength={100}
        value={name}
        disabled={isSaving}
        onChange={(event) => {
          setName(event.currentTarget.value);
          setIsSuccess(false);
        }}
      />

      {saveError && <p role="alert">{t(saveError)}</p>}
      {isSuccess && <p role="status">{t("settings.nameSaved")}</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving ? t("settings.saving") : t("settings.saveName")}
      </button>
    </form>
  );
}
