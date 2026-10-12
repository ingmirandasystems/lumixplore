import { useState } from "react";
import { register } from "../../services/auth";
import type { RegisterData } from "../../services/auth";
import { Link } from "react-router";

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    region: "MX",
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleRegister(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterError(null);

    if (formData.name.trim() === "") {
      setRegisterError("Escribe tu nombre.");
      return;
    }

    setIsRegistering(true);

    try {
      await register(formData);
      setIsSuccess(true);
    } catch (error: unknown) {
      setRegisterError(
        error instanceof Error ? error.message : "No se pudo crear la cuenta",
      );
    } finally {
      setIsRegistering(false);
    }
  }

  if (isSuccess) {
    return (
      <div role="status">
        <h2>Revisa tu correo</h2>
        <p>
          Creamos tu cuenta. Para iniciar sesión, verifica tu correo electrónico
          siguiendo las instrucciones que recibirás.
        </p>
        <Link to="/resend-verification" state={{ email: formData.email }}>
          ¿No recibiste el correo? Solicitar otro
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister}>
      <label htmlFor="register-name">Nombre</label>

      <input
        id="register-name"
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

      <label htmlFor="register-email">Correo electrónico</label>

      <input
        id="register-email"
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

      <label htmlFor="register-password">Contraseña</label>

      <input
        id="register-password"
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

      {registerError && <p role="alert">{registerError}</p>}

      <button type="submit" disabled={isRegistering}>
        {isRegistering ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
