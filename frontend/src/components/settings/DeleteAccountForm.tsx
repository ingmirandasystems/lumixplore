import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { GoogleAccountConfirmation } from "./GoogleAccountConfirmation";
import { FloatingInput } from "../../components/ui/FloatingInput";
import { SettingsFormActions } from "./SettingsFormActions";

interface DeleteAccountFormProps {
  hasLocalPassword: boolean;
  onCancel: () => void;
  onBusyChange: (busy: boolean) => void;
}

export function DeleteAccountForm({
  hasLocalPassword,
  onCancel,
  onBusyChange,
}: DeleteAccountFormProps) {
  const { t } = useTranslation();
  const { deleteAccount } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isDeleting) return;

    setDeleteError(null);

    if (!confirmed) {
      setDeleteError("settings.deleteConfirmationRequired");
      return;
    }

    if (hasLocalPassword && !currentPassword) {
      setDeleteError("settings.deletePasswordRequired");
      return;
    }

    if (!hasLocalPassword && !googleCredential) {
      setDeleteError("settings.deleteGoogleConfirm");
      return;
    }

    setIsDeleting(true);
    onBusyChange(true);

    try {
      if (hasLocalPassword) {
        await deleteAccount({
          method: "password",
          currentPassword,
          confirmation: true,
        });
      } else if (googleCredential) {
        await deleteAccount({
          method: "google",
          credential: googleCredential,
          confirmation: true,
        });
      }
    } catch (error: unknown) {
      let errorKey = getCommonErrorKey(error, "settings.deleteError");

      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_ACCOUNT_DELETION_DATA":
            errorKey = "settings.deleteInvalidData";
            break;
          case "ACCOUNT_CONFIRMATION_FAILED":
            errorKey = "settings.deleteIdentityError";
            setGoogleCredential(null);
            break;
          case "GOOGLE_CONFIRMATION_REQUIRED":
          case "INVALID_GOOGLE_CREDENTIAL":
            errorKey = "settings.deleteGoogleConfirm";
            setGoogleCredential(null);
            break;
          case "SESSION_INVALID":
            errorKey = "settings.sessionInvalid";
            break;
        }
      }

      setDeleteError(errorKey);
    } finally {
      setIsDeleting(false);
      onBusyChange(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <p className="settings-form__description">
        {t("settings.deleteDescription")}
      </p>

      {hasLocalPassword ? (
        <FloatingInput
          id="delete-current-password"
          label={t("settings.currentPassword")}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={currentPassword}
          disabled={isDeleting}
          onChange={(event) => setCurrentPassword(event.currentTarget.value)}
        />
      ) : (
        <>
          <p className="settings-form__description">
            {t("settings.deleteGoogleDescription")}
          </p>

          <GoogleAccountConfirmation
            onCredential={setGoogleCredential}
            disabled={isDeleting}
          />

          {googleCredential && (
            <p className="settings-form__success" role="status">
              {t("settings.deleteGoogleReady")}
            </p>
          )}
        </>
      )}

      <label className="settings-form__confirmation">
        <input
          type="checkbox"
          required
          checked={confirmed}
          disabled={isDeleting}
          onChange={(event) => setConfirmed(event.currentTarget.checked)}
        />

        <span>{t("settings.deleteConfirmation")}</span>
      </label>

      {deleteError && (
        <p className="settings-form__error" role="alert">
          {t(deleteError)}
        </p>
      )}

      <SettingsFormActions
        danger
        busy={isDeleting}
        disabled={
          !confirmed ||
          (hasLocalPassword ? !currentPassword : !googleCredential)
        }
        onCancel={onCancel}
        submitLabel={
          isDeleting
            ? t("settings.deletingAccount")
            : t("settings.deleteAccount")
        }
      />
    </form>
  );
}
