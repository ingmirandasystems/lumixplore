import { sendEmail } from "../../services/mail.service.js";

export async function sendAuthEmail(
  email: string,
  token: string,
  purpose: "email_verification" | "password_reset",
): Promise<boolean> {
  const isVerification = purpose === "email_verification";

  const subject = isVerification
    ? "Verifica tu correo — LumiXplore"
    : "Restablece tu contraseña — LumiXplore";

  const instruction = isVerification
    ? "Abre el enlace y confirma la verificación de tu correo."
    : "Abre el enlace para elegir una nueva contraseña.";

  const expiration = isVerification
    ? "Este enlace vence en 24 horas."
    : "Este enlace vence en 30 minutos.";

  try {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("Falta configurar FRONTEND_URL");
    }

    const actionUrl = new URL(
      isVerification ? "/verify-email" : "/reset-password",
      frontendUrl,
    );

    actionUrl.searchParams.set("token", token);

    const content = actionUrl.toString();
    await sendEmail({
      to: email,
      subject,
      text: `${instruction}\n\n${content}\n\n${expiration}\n\nSi no solicitaste esto, ignora el mensaje.`,
      html: `
        <h1>LumiXplore</h1>
        <p>${instruction}</p>
        <p>
          <a href="${content}">
            ${isVerification ? "Verificar mi correo" : "Restablecer contraseña"}
          </a>
        </p>
        <p>${expiration}</p>
        <p>Si no solicitaste esto, ignora el mensaje.</p>
      `,
    });

    return true;
  } catch {
    console.error("No se pudo enviar el correo de autenticación:", purpose);

    return false;
  }
}
