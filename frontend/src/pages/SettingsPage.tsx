import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { NameSettingsForm } from "../components/settings/NameSettingsForm";
import { RegionSettingsForm } from "../components/settings/RegionSettingsForm";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ChangePasswordForm } from "../components/settings/ChangePasswordForm";
import { DeleteAccountForm } from "../components/settings/DeleteAccountForm";
import { SettingsModal } from "../components/settings/SettingsModal";
import "./SettingsPage.css";
import { usePageTitle } from "../hooks/usePageTitle";

type SettingsDialog = "name" | "password" | "region" | "delete";

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [activeDialog, setActiveDialog] = useState<SettingsDialog | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  usePageTitle(t("settings.title"));

  if (!user) return null;

  const language = i18n.resolvedLanguage?.startsWith("en") ? "en" : "es";

  const regionName =
    new Intl.DisplayNames([language], { type: "region" }).of(user.region) ??
    user.region;

  const dialogTitles: Record<SettingsDialog, string> = {
    name: t("settings.ui.editName"),
    password: t("settings.changePassword"),
    region: t("settings.ui.changeRegion"),
    delete: t("settings.deleteAccount"),
  };

  function openDialog(dialog: SettingsDialog) {
    setSuccessKey(null);
    setIsBusy(false);
    setActiveDialog(dialog);
  }

  function closeDialog() {
    if (isBusy) return;

    setActiveDialog(null);
  }

  function finishEditing(messageKey: string) {
    setIsBusy(false);
    setActiveDialog(null);
    setSuccessKey(messageKey);
  }

  return (
    <main className="main-content settings-page">
      <h1 className="settings-page__title">{t("settings.title")}</h1>

      {successKey && (
        <p className="settings-page__success" role="status">
          {t(successKey)}
        </p>
      )}

      <div className="settings-page__sections">
        <section
          className="settings-page__section"
          aria-labelledby="settings-profile-heading"
        >
          <h2 id="settings-profile-heading">{t("settings.profile")}</h2>

          <div className="settings-page__fields">
            <div className="settings-page__field">
              <h3>{t("common.name")}</h3>

              <p className="settings-page__value">{user.name}</p>

              {user.hasLocalPassword && (
                <button
                  type="button"
                  className="settings-page__edit"
                  onClick={() => openDialog("name")}
                >
                  {t("settings.ui.editName")}
                </button>
              )}
            </div>

            <div className="settings-page__field">
              <h3>{t("common.email")}</h3>

              <p className="settings-page__value">{user.email}</p>
            </div>
          </div>
        </section>

        {user.hasLocalPassword && (
          <section
            className="settings-page__section"
            aria-labelledby="settings-security-heading"
          >
            <h2 id="settings-security-heading">{t("settings.security")}</h2>

            <div className="settings-page__field">
              <h3>{t("settings.ui.password")}</h3>

              <p
                className="settings-page__value settings-page__value--password"
                aria-label={t("settings.ui.hiddenPassword")}
              >
                <span aria-hidden="true">••••••••••••</span>
              </p>

              <button
                type="button"
                className="settings-page__edit"
                onClick={() => openDialog("password")}
              >
                {t("settings.changePassword")}
              </button>
            </div>
          </section>
        )}

        <section
          className="settings-page__section"
          aria-labelledby="settings-localization-heading"
        >
          <h2 id="settings-localization-heading">
            {t("settings.languageAndRegion")}
          </h2>

          <div className="settings-page__fields">
            <div className="settings-page__field">
              <h3>{t("settings.ui.region")}</h3>

              <p className="settings-page__value">{regionName}</p>

              <button
                type="button"
                className="settings-page__edit"
                onClick={() => openDialog("region")}
              >
                {t("settings.ui.changeRegion")}
              </button>
            </div>

            <div className="settings-page__field">
              <h3>{t("settings.language")}</h3>
              <LanguageSwitcher />
            </div>
          </div>
        </section>

        <section
          className="settings-page__section settings-page__section--danger"
          aria-label={t("settings.deleteAccount")}
        >
          <button
            type="button"
            className="settings-page__delete"
            onClick={() => openDialog("delete")}
          >
            {t("settings.deleteAccount")}
          </button>
        </section>
      </div>

      {activeDialog && (
        <SettingsModal
          key={activeDialog}
          title={dialogTitles[activeDialog]}
          busy={isBusy}
          onClose={closeDialog}
        >
          {activeDialog === "name" && user.hasLocalPassword && (
            <NameSettingsForm
              initialName={user.name}
              onCancel={closeDialog}
              onSuccess={() => finishEditing("settings.nameSaved")}
              onBusyChange={setIsBusy}
            />
          )}

          {activeDialog === "password" && user.hasLocalPassword && (
            <ChangePasswordForm
              onCancel={closeDialog}
              onSuccess={() => finishEditing("settings.ui.passwordSaved")}
              onBusyChange={setIsBusy}
            />
          )}

          {activeDialog === "region" && (
            <RegionSettingsForm
              initialRegion={user.region}
              onCancel={closeDialog}
              onSuccess={() => finishEditing("settings.regionSaved")}
              onBusyChange={setIsBusy}
            />
          )}

          {activeDialog === "delete" && (
            <DeleteAccountForm
              hasLocalPassword={user.hasLocalPassword}
              onCancel={closeDialog}
              onBusyChange={setIsBusy}
            />
          )}
        </SettingsModal>
      )}
    </main>
  );
}
