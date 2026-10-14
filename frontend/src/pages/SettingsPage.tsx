import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { NameSettingsForm } from "../components/settings/NameSettingsForm";
import { RegionSettingsForm } from "../components/settings/RegionSettingsForm";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ChangePasswordForm } from "../components/settings/ChangePasswordForm";
import { DeleteAccountForm } from "../components/settings/DeleteAccountForm";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main>
      <h1>{t("settings.title")}</h1>

      <section>
        <h2>{t("settings.profile")}</h2>

        {user.hasLocalPassword ? (
          <NameSettingsForm initialName={user.name} />
        ) : (
          <div>
            <p>{t("common.name")}</p>
            <p>{user.name}</p>
          </div>
        )}

        <p>{t("common.email")}</p>
        <p>{user.email}</p>
      </section>

      {user.hasLocalPassword && (
        <section>
          <h2>{t("settings.security")}</h2>
          <ChangePasswordForm />
        </section>
      )}

      <section>
        <h2>{t("settings.languageAndRegion")}</h2>

        <RegionSettingsForm initialRegion={user.region} />
        <LanguageSwitcher />
      </section>

      <section>
        <h2>{t("settings.deleteAccount")}</h2>
        <DeleteAccountForm hasLocalPassword={user.hasLocalPassword} />
      </section>
    </main>
  );
}
