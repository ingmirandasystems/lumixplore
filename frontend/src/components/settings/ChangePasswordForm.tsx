import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    if (newPassword !== confirmPassword) {
      setSaveError("settings.passwordMismatch");
      return;
    }

    setIsSaving(true);

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
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>{t("settings.passwordChangeDescription")}</p>

      <label htmlFor="settings-current-password">
        {t("settings.currentPassword")}
      </label>
      <input
        id="settings-current-password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        maxLength={128}
        value={currentPassword}
        disabled={isSaving}
        onChange={(event) => {
          setCurrentPassword(event.currentTarget.value);
        }}
      />

      <label htmlFor="settings-new-password">{t("settings.newPassword")}</label>
      <input
        id="settings-new-password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={newPassword}
        disabled={isSaving}
        onChange={(event) => {
          setNewPassword(event.currentTarget.value);
        }}
      />

      <label htmlFor="settings-confirm-password">
        {t("common.confirmPassword")}
      </label>
      <input
        id="settings-confirm-password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={confirmPassword}
        disabled={isSaving}
        onChange={(event) => {
          setConfirmPassword(event.currentTarget.value);
        }}
      />

      {saveError && <p role="alert">{t(saveError)}</p>}

      <button type="submit" disabled={isSaving}>
        {isSaving
          ? t("settings.changingPassword")
          : t("settings.changePassword")}
      </button>
    </form>
  );
}
