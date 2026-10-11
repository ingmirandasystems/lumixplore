import "dotenv/config";

const baseUrl = "http://localhost:3000/api/auth";

async function main() {
  const email = process.env.TEST_AUTH_EMAIL;
  const oldPassword = process.env.TEST_AUTH_OLD_PASSWORD;
  const newPassword = process.env.TEST_AUTH_NEW_PASSWORD;
  const token = process.env.TEST_AUTH_RESET_TOKEN;

  if (!email || !oldPassword || !newPassword || !token) {
    throw new Error("Faltan las variables TEST_AUTH en .env.");
  }

  async function post(path: string, body: object) {
    return fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify(body),
    });
  }

  const [login, reset] = await Promise.all([
    post("/login", { email, password: oldPassword }),
    post("/reset-password", { token, password: newPassword }),
  ]);

  console.log("Login simultáneo:", login.status);
  console.log("Restablecimiento:", reset.status);

  if (reset.status !== 200) {
    throw new Error(
      "No se pudo restablecer. Revisa el token y los límites de solicitudes.",
    );
  }

  if (login.status === 200) {
    const cookie = login.headers.get("set-cookie")?.split(";")[0];

    if (!cookie) {
      throw new Error("El login no entregó una cookie.");
    }

    const session = await fetch(`${baseUrl}/me`, {
      headers: { Cookie: cookie },
    });

    console.log("Sesión del login simultáneo:", session.status);

    if (session.status !== 401) {
      throw new Error("La sesión anterior al cambio sigue siendo válida.");
    }
  } else if (login.status !== 401) {
    throw new Error("El login devolvió un resultado inesperado.");
  }

  const oldLogin = await post("/login", {
    email,
    password: oldPassword,
  });

  const newLogin = await post("/login", {
    email,
    password: newPassword,
  });

  console.log("Contraseña anterior:", oldLogin.status);
  console.log("Contraseña nueva:", newLogin.status);

  if (oldLogin.status !== 401 || newLogin.status !== 200) {
    throw new Error("Las contraseñas no dieron los resultados esperados.");
  }

  // Cierra la sesión creada por la comprobación final.
  const newCookie = newLogin.headers.get("set-cookie")?.split(";")[0];

  if (newCookie) {
    const logout = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: {
        Cookie: newCookie,
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (logout.status !== 204) {
      throw new Error("No se pudo cerrar la sesión de prueba.");
    }
  }

  console.log("Prueba completada correctamente.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falló la prueba.");
  process.exitCode = 1;
});
