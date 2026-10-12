import { readErrorMessage } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  language: "es" | "en";
  region: string;
  timezone: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  last_name?: string;
  email: string;
  password: string;
  language?: "es" | "en";
  region: string;
  timezone?: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const message = await readErrorMessage(
      response,
      "No se pudo comprobar la sesión",
    );

    throw new Error(message);
  }

  const data: { user: AuthUser } = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const message = await readErrorMessage(
      response,
      "No se pudo cerrar la sesión",
    );

    throw new Error(message);
  }
}

export async function login(credentials: LoginCredentials): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const message = await readErrorMessage(
      response,
      "No se pudo iniciar sesión",
    );

    throw new Error(message);
  }
}

export async function register(data: RegisterData): Promise<void> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await readErrorMessage(
      response,
      "No se pudo crear la cuenta",
    );

    throw new Error(message);
  }
}

export async function verifyEmail(token: string): Promise<void> {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(
      response,
      "No se pudo verificar el correo",
    );

    throw new Error(message);
  }
}

export async function resendVerification(email: string): Promise<void> {
  const response = await fetch("/api/auth/resend-verification", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const message = await readErrorMessage(
      response,
      "No se pudo solicitar otro correo de verificación",
    );

    throw new Error(message);
  }
}
