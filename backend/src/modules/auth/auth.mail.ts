import { sendEmail } from "../../services/mail.service.js";

const translations = {
  es: {
    verificationSubject: "Verifica tu correo — LumiXplore",
    resetSubject: "Restablece tu contraseña — LumiXplore",
    verificationEyebrow: "Una nueva historia comienza",
    resetEyebrow: "Volvamos a conectar",
    verificationTitle: "Tu próxima historia te espera.",
    resetTitle: "Recupera el acceso a tu cuenta.",
    verificationInstruction:
      "Confirma tu correo electrónico para empezar a descubrir películas y series con LumiXplore.",
    resetInstruction:
      "Recibimos una solicitud para restablecer tu contraseña. Abre el enlace para elegir una nueva.",
    verificationExpiration: "Este enlace vence en 24 horas.",
    resetExpiration: "Este enlace vence en 30 minutos.",
    verificationButton: "Verificar mi correo",
    resetButton: "Restablecer contraseña",
    fallback: "Si el botón no funciona, copia y pega este enlace:",
    ignore:
      "Si no solicitaste este correo, puedes ignorarlo. No compartas este enlace con otras personas.",
    footer: "Una historia para cada emoción.",
    automated: "Este mensaje se envió automáticamente.",
  },
  en: {
    verificationSubject: "Verify your email — LumiXplore",
    resetSubject: "Reset your password — LumiXplore",
    verificationEyebrow: "A new story begins",
    resetEyebrow: "Let's reconnect",
    verificationTitle: "Your next story awaits.",
    resetTitle: "Get back into your account.",
    verificationInstruction:
      "Confirm your email address to start discovering movies and TV shows with LumiXplore.",
    resetInstruction:
      "We received a request to reset your password. Open the link to choose a new one.",
    verificationExpiration: "This link expires in 24 hours.",
    resetExpiration: "This link expires in 30 minutes.",
    verificationButton: "Verify my email",
    resetButton: "Reset password",
    fallback: "If the button doesn't work, copy and paste this link:",
    ignore:
      "If you did not request this email, you can ignore it. Do not share this link with anyone.",
    footer: "A story for every emotion.",
    automated: "This message was sent automatically.",
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });
}

function renderLogo(): string {
  const configuredLogo = process.env.MAIL_LOGO_URL?.trim();

  if (configuredLogo) {
    const url = new URL(configuredLogo);

    if (url.protocol !== "https:") {
      throw new Error("MAIL_LOGO_URL debe usar HTTPS.");
    }

    return `
      <img
        src="${escapeHtml(url.toString())}"
        width="200"
        alt="LumiXplore"
        style="
          display: block;
          width: 200px;
          max-width: 100%;
          height: auto;
          margin: 0 auto;
          color: #ffffff;
          font-size: 28px;
        "
      />
    `;
  }

  return `
    <span style="
      color: #ffffff;
      font-size: 30px;
      font-weight: 600;
      letter-spacing: -1px;
    ">
      Lumi<span style="color: #d2bef2;">X</span>plore
    </span>
  `;
}

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

  const eyebrow = isVerification
    ? texts.verificationEyebrow
    : texts.resetEyebrow;

  const title = isVerification ? texts.verificationTitle : texts.resetTitle;

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
      throw new Error("Falta configurar FRONTEND_URL.");
    }

    const baseUrl = new URL(frontendUrl);

    if (
      !["http:", "https:"].includes(baseUrl.protocol) ||
      (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:")
    ) {
      throw new Error("FRONTEND_URL tiene un protocolo inválido.");
    }

    const actionUrl = new URL(
      isVerification ? "/verify-email" : "/reset-password",
      baseUrl,
    );

    actionUrl.searchParams.set("token", token);

    const link = actionUrl.toString();
    const safeLink = escapeHtml(link);

    await sendEmail({
      to: email,
      subject,
      text: [
        "LumiXplore",
        "",
        title,
        "",
        instruction,
        "",
        `${buttonText}: ${link}`,
        "",
        expiration,
        "",
        texts.ignore,
      ].join("\n"),
      html: `
        <!DOCTYPE html>
        <html lang="${locale}">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>${escapeHtml(subject)}</title>
          </head>

          <body style="
            margin: 0;
            padding: 0;
            background-color: #000000;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-text-size-adjust: 100%;
          ">
            <div style="
              display: none;
              max-height: 0;
              overflow: hidden;
              opacity: 0;
              color: transparent;
              mso-hide: all;
            ">
              ${escapeHtml(instruction)}
            </div>

            <table
              role="presentation"
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              bgcolor="#000000"
            >
              <tr>
                <td align="center" style="padding: 40px 16px;">
                  <table
                    role="presentation"
                    width="560"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="width: 100%; max-width: 560px;"
                  >
                    <tr>
                      <td
                        align="center"
                        bgcolor="#000000"
                        style="padding: 0 16px 32px;"
                      >
                        ${renderLogo()}
                      </td>
                    </tr>

                    <tr>
                      <td style="
                        padding: 1px;
                        border-radius: 24px;
                        background-color: #74608c;
                        background-image: linear-gradient(
                          90deg,
                          #ff497c 0%,
                          #ffae42 20%,
                          #ffe663 40%,
                          #55dfaa 60%,
                          #54baff 80%,
                          #ac78ff 100%
                        );
                      ">
                        <table
                          role="presentation"
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          bgcolor="#15151c"
                          style="border-radius: 23px;"
                        >
                          <tr>
                            <td style="padding: 36px 28px;">
                              <p style="
                                margin: 0 0 16px;
                                color: #bda8e2;
                                font-size: 11px;
                                font-weight: 600;
                                line-height: 18px;
                                letter-spacing: 2px;
                                text-transform: uppercase;
                              ">
                                ${escapeHtml(eyebrow)}
                              </p>

                              <h1 style="
                                margin: 0 0 18px;
                                color: #ffffff;
                                font-size: 30px;
                                font-weight: 700;
                                line-height: 38px;
                                letter-spacing: -1px;
                              ">
                                ${escapeHtml(title)}
                              </h1>

                              <p style="
                                margin: 0 0 28px;
                                color: #c5c5cf;
                                font-size: 15px;
                                line-height: 26px;
                              ">
                                ${escapeHtml(instruction)}
                              </p>

                              <table
                                role="presentation"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                              >
                                <tr>
                                  <td
                                    align="center"
                                    bgcolor="#ffffff"
                                    style="border-radius: 50px;"
                                  >
                                    <a
                                      href="${safeLink}"
                                      style="
                                        display: inline-block;
                                        padding: 14px 24px;
                                        border: 1px solid #ffffff;
                                        border-radius: 50px;
                                        color: #15151c;
                                        font-size: 14px;
                                        font-weight: 600;
                                        line-height: 20px;
                                        text-align: center;
                                        text-decoration: none;
                                      "
                                    >
                                      ${escapeHtml(buttonText)}
                                    </a>
                                  </td>
                                </tr>
                              </table>

                              <p style="
                                margin: 20px 0 0;
                                color: #bda8e2;
                                font-size: 12px;
                                line-height: 21px;
                              ">
                                ${escapeHtml(expiration)}
                              </p>

                              <table
                                role="presentation"
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                style="margin-top: 28px;"
                              >
                                <tr>
                                  <td style="
                                    padding-top: 24px;
                                    border-top: 1px solid #303039;
                                  ">
                                    <p style="
                                      margin: 0 0 10px;
                                      color: #9595a3;
                                      font-size: 12px;
                                      line-height: 21px;
                                    ">
                                      ${escapeHtml(texts.fallback)}
                                    </p>

                                    <p style="
                                      margin: 0;
                                      font-size: 12px;
                                      line-height: 21px;
                                      word-break: break-all;
                                      overflow-wrap: anywhere;
                                    ">
                                      <a
                                        href="${safeLink}"
                                        style="
                                          color: #c8b7ed;
                                          text-decoration: underline;
                                          word-break: break-all;
                                        "
                                      >
                                        ${safeLink}
                                      </a>
                                    </p>

                                    <p style="
                                      margin: 20px 0 0;
                                      color: #858592;
                                      font-size: 12px;
                                      line-height: 21px;
                                    ">
                                      ${escapeHtml(texts.ignore)}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding: 0 28px 28px;">
                              <table
                                role="presentation"
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                              >
                                <tr>
                                  <td width="16%" height="3" bgcolor="#ff497c"></td>
                                  <td width="17%" height="3" bgcolor="#ffae42"></td>
                                  <td width="17%" height="3" bgcolor="#ffe663"></td>
                                  <td width="17%" height="3" bgcolor="#55dfaa"></td>
                                  <td width="17%" height="3" bgcolor="#54baff"></td>
                                  <td width="16%" height="3" bgcolor="#ac78ff"></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td align="center" style="padding: 24px 16px 0;">
                        <p style="
                          margin: 0;
                          color: #777783;
                          font-size: 12px;
                          line-height: 21px;
                        ">
                          ${escapeHtml(texts.footer)}
                        </p>

                        <p style="
                          margin: 8px 0 0;
                          color: #646470;
                          font-size: 11px;
                          line-height: 20px;
                        ">
                          ${escapeHtml(texts.automated)}
                          <br />
                          © ${new Date().getFullYear()} LumiXplore
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return true;
  } catch {
    console.error("No se pudo enviar el correo de autenticación:", purpose);

    return false;
  }
}
