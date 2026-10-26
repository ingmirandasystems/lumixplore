import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { register } from "../../services/auth";
import type { RegisterData } from "../../services/auth";
import { ApiError, getCommonErrorKey } from "../../services/api";
import { RegionSelect } from "../RegionSelect";
import { FloatingInput } from "../ui/FloatingInput";
import errorIcon from "../../assets/icons/error-icon.svg";
import successIcon from "../../assets/icons/success-icon.svg";
import "./RegisterForm.css";

export function RegisterForm() {
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    region: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleRegister(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError(null);

    if (formData.name.trim() === "") {
      setRegisterError("register.nameRequired");
      return;
    }

    if (formData.password !== confirmPassword) {
      setRegisterError("register.passwordMismatch");
      return;
    }

    if (!formData.region) {
      setRegisterError("region.unsupported");
      return;
    }

    setIsRegistering(true);

    try {
      await register({
        ...formData,
        language: i18n.resolvedLanguage === "es" ? "es" : "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      setIsSuccess(true);
    } catch (error: unknown) {
      let errorKey = getCommonErrorKey(error, "register.error");

      if (error instanceof ApiError) {
        switch (error.code) {
          case "INVALID_REGISTRATION_DATA":
            errorKey = "register.invalidData";
            break;
          case "EMAIL_UNAVAILABLE":
            errorKey = "register.emailUnavailable";
            break;
          case "UNSUPPORTED_REGION":
            errorKey = "region.unsupported";
            break;
        }
      }

      setRegisterError(errorKey);
    } finally {
      setIsRegistering(false);
    }
  }

  if (isSuccess) {
    return (
      <div role="status" className="register-form__success--container">
        <img src={successIcon} alt="" />
        <div>
          <h2>{t("register.successTitle")}</h2>
          <p>{t("register.successDescription")}</p>

          <Link to="/resend-verification" state={{ email: formData.email }}>
            {t("register.resendLink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="login-form" onSubmit={handleRegister}>
      <FloatingInput
        id="register-name"
        label={t("common.name")}
        name="name"
        type="text"
        autoComplete="given-name"
        required
        maxLength={100}
        value={formData.name}
        onChange={(event) => {
          const name = event.currentTarget.value;

          setFormData((previous) => ({
            ...previous,
            name,
          }));
        }}
      />

      <FloatingInput
        id="register-email"
        label={t("common.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        value={formData.email}
        onChange={(event) => {
          const email = event.currentTarget.value;

          setFormData((previous) => ({
            ...previous,
            email,
          }));
        }}
      />

      <RegionSelect
        value={formData.region}
        disabled={isRegistering}
        onChange={(region) => {
          setFormData((previous) => ({
            ...previous,
            region,
          }));
        }}
      />

      <FloatingInput
        id="register-password"
        label={t("common.password")}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={formData.password}
        onChange={(event) => {
          const password = event.currentTarget.value;

          setFormData((previous) => ({
            ...previous,
            password,
          }));
        }}
      />

      <FloatingInput
        id="register-confirm-password"
        label={t("common.confirmPassword")}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(event.currentTarget.value);
        }}
      />

      {registerError && (
        <div className="register-form__error--container">
          <img src={errorIcon} alt="" />
          <div>
            <p role="alert">{t(registerError)}</p>
          </div>
        </div>
      )}

      <button type="submit" disabled={isRegistering}>
        {isRegistering ? t("register.submitting") : t("common.register")}
      </button>
    </form>
  );
}
