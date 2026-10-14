import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { GoogleAccountConfirmation } from "./GoogleAccountConfirmation";

interface DeleteAccountFormProps {
  hasLocalPassword: boolean;
}

export function DeleteAccountForm({
  hasLocalPassword,
}: DeleteAccountFormProps) {
  const { t } = useTranslation();
  const { deleteAccount } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
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
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>{t("settings.deleteDescription")}</p>

      {hasLocalPassword ? (
        <>
          <label htmlFor="delete-current-password">
            {t("settings.currentPassword")}
          </label>

          <input
            id="delete-current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={currentPassword}
            disabled={isDeleting}
            onChange={(event) => {
              setCurrentPassword(event.currentTarget.value);
            }}
          />
        </>
      ) : (
        <>
          <p>{t("settings.deleteGoogleDescription")}</p>
          <p>{t("settings.deleteGoogleConfirm")}</p>
          <GoogleAccountConfirmation
            onCredential={setGoogleCredential}
            disabled={isDeleting}
          />

          {googleCredential && (
            <p role="status">{t("settings.deleteGoogleReady")}</p>
          )}
        </>
      )}

      <label>
        <input
          type="checkbox"
          required
          checked={confirmed}
          disabled={isDeleting}
          onChange={(event) => {
            setConfirmed(event.currentTarget.checked);
          }}
        />
        {t("settings.deleteConfirmation")}
      </label>

      {deleteError && <p role="alert">{t(deleteError)}</p>}

      <button
        type="submit"
        disabled={
          isDeleting || !confirmed || (!hasLocalPassword && !googleCredential)
        }
      >
        {isDeleting
          ? t("settings.deletingAccount")
          : t("settings.deleteAccount")}
      </button>
    </form>
  );
}
