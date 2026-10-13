import { sendEmail } from "../../services/mail.service.js";

const translations = {
  es: {
    verificationSubject: "Verifica tu correo — LumiXplore",
    resetSubject: "Restablece tu contraseña — LumiXplore",
    verificationInstruction:
      "Abre el enlace y confirma la verificación de tu correo.",
    resetInstruction: "Abre el enlace para elegir una nueva contraseña.",
    verificationExpiration: "Este enlace vence en 24 horas.",
    resetExpiration: "Este enlace vence en 30 minutos.",
    verificationButton: "Verificar mi correo",
    resetButton: "Restablecer contraseña",
    ignore: "Si no solicitaste esto, ignora el mensaje.",
  },
  en: {
    verificationSubject: "Verify your email — LumiXplore",
    resetSubject: "Reset your password — LumiXplore",
    verificationInstruction:
      "Open the link and confirm your email verification.",
    resetInstruction: "Open the link to choose a new password.",
    verificationExpiration: "This link expires in 24 hours.",
    resetExpiration: "This link expires in 30 minutes.",
    verificationButton: "Verify my email",
    resetButton: "Reset password",
    ignore: "If you did not request this, ignore this message.",
  },
};

export async function sendAuthEmail(
  email: string,
  token: string,
  purpose: "email_verification" | "password_reset",
  language: string,
): Promise<boolean> {
  const locale = language === "es" ? "es" : "en";
  const texts = translations[locale];
  const isVerification = purpose === "email_verification";

  const subject = isVerification
    ? texts.verificationSubject
    : texts.resetSubject;

  const instruction = isVerification
    ? texts.verificationInstruction
    : texts.resetInstruction;

  const expiration = isVerification
    ? texts.verificationExpiration
    : texts.resetExpiration;

  const buttonText = isVerification
    ? texts.verificationButton
    : texts.resetButton;

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
      text: `${instruction}\n\n${content}\n\n${expiration}\n\n${texts.ignore}`,
      html: `
        <div lang="${locale}">
          <h1>LumiXplore</h1>
          <p>${instruction}</p>
          <p><a href="${content}">${buttonText}</a></p>
          <p>${expiration}</p>
          <p>${texts.ignore}</p>
        </div>
      `,
    });

    return true;
  } catch {
    console.error("No se pudo enviar el correo de autenticación:", purpose);
    return false;
  }
}
