import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { FloatingInput } from "../../components/ui/FloatingInput";
import { SettingsFormActions } from "./SettingsFormActions";

interface NameSettingsFormProps {
  initialName: string;
  onCancel: () => void;
  onSuccess: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function NameSettingsForm({
  initialName,
  onCancel,
  onSuccess,
  onBusyChange,
}: NameSettingsFormProps) {
  const { t } = useTranslation();
  const { updateName } = useAuth();

  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    setSaveError(null);

    if (!name.trim()) {
      setSaveError("settings.invalidName");
      return;
    }

    setIsSaving(true);
    onBusyChange(true);

    try {
      await updateName(name.trim());
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
      return;
    } finally {
      setIsSaving(false);
      onBusyChange(false);
    }

    onSuccess();
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <FloatingInput
        id="settings-name"
        label={t("common.name")}
        name="name"
        autoComplete="name"
        required
        maxLength={100}
        value={name}
        disabled={isSaving}
        onChange={(event) => setName(event.currentTarget.value)}
      />

      {saveError && (
        <p className="settings-form__error" role="alert">
          {t(saveError)}
        </p>
      )}

      <SettingsFormActions
        busy={isSaving}
        onCancel={onCancel}
        submitLabel={
          isSaving ? t("settings.saving") : t("settings.ui.saveChanges")
        }
      />
    </form>
  );
}
