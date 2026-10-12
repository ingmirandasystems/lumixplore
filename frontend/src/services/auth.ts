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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`No se pudo comprobar la sesión (${response.status})`);
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
    throw new Error("No se pudo cerrar la sesión");
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
    let message = "No se pudo iniciar sesión";

    try {
      const data: unknown = await response.json();

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        message = data.message;
      }
    } catch {
      // Conservamos el mensaje general si el cuerpo no es JSON válido.
    }

    throw new Error(message);
  }
}
