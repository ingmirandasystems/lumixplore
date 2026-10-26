import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { FloatingInput } from "../../components/ui/FloatingInput";
import { SettingsFormActions } from "./SettingsFormActions";

interface ChangePasswordFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function ChangePasswordForm({
  onCancel,
  onSuccess,
  onBusyChange,
}: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    setSaveError(null);

    if (newPassword !== confirmPassword) {
      setSaveError("settings.passwordMismatch");
      return;
    }

    setIsSaving(true);
    onBusyChange(true);

    try {
      await changePassword({ currentPassword, newPassword });
    } catch (error: unknown) {
      let errorKey = getCommonErrorKey(error, "settings.passwordChangeError");

      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_PASSWORD_CHANGE_DATA":
            errorKey = "settings.invalidPasswordChangeData";
            break;
          case "CURRENT_PASSWORD_INCORRECT":
            errorKey = "settings.currentPasswordIncorrect";
            break;
          case "PASSWORD_CHANGE_NOT_ALLOWED":
            errorKey = "settings.passwordChangeNotAllowed";
            break;
          case "SESSION_INVALID":
            errorKey = "settings.sessionInvalid";
            break;
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
      <p className="settings-form__description">
        {t("settings.passwordChangeDescription")}
      </p>

      <FloatingInput
        id="settings-current-password"
        label={t("settings.currentPassword")}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        maxLength={128}
        value={currentPassword}
        disabled={isSaving}
        onChange={(event) => setCurrentPassword(event.currentTarget.value)}
      />

      <FloatingInput
        id="settings-new-password"
        label={t("settings.newPassword")}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={newPassword}
        disabled={isSaving}
        onChange={(event) => setNewPassword(event.currentTarget.value)}
      />

      <FloatingInput
        id="settings-confirm-password"
        label={t("common.confirmPassword")}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={confirmPassword}
        disabled={isSaving}
        onChange={(event) => setConfirmPassword(event.currentTarget.value)}
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
          isSaving
            ? t("settings.changingPassword")
            : t("settings.ui.saveChanges")
        }
      />
    </form>
  );
}
