import "dotenv/config";

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

function buildEmail(): string {
  const configuredLogo = process.env.MAIL_LOGO_URL?.trim();

  let logoUrl: string | null = null;

  if (configuredLogo) {
    const url = new URL(configuredLogo);

    if (url.protocol !== "https:") {
      throw new Error("MAIL_LOGO_URL debe ser una URL pública HTTPS.");
    }

    logoUrl = escapeHtml(url.toString());
  }

  const logo = logoUrl
    ? `
      <img
        src="${logoUrl}"
        width="200"
        alt="LumiXplore"
        style="
          display: block;
          width: 200px;
          max-width: 100%;
          height: auto;
          margin: 0 auto;
          color: #ffffff;
          font-size: 26px;
        "
      />
    `
    : `
      <span style="
        color: #ffffff;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -1px;
      ">
        Lumi<span style="color: #d2bef2;">X</span>plore
      </span>
    `;

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>LumiXplore</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #09090d;
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
          Tu primer correo real de LumiXplore está aquí.
        </div>

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          bgcolor="#09090d"
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
                  <td align="center" style="padding: 0 16px 32px;">
                    ${logo}
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
                            Una nueva historia comienza
                          </p>

                          <h1 style="
                            margin: 0 0 18px;
                            color: #ffffff;
                            font-size: 30px;
                            font-weight: 700;
                            line-height: 38px;
                            letter-spacing: -1px;
                          ">
                            Ya estamos conectados.
                          </h1>

                          <p style="
                            margin: 0 0 24px;
                            color: #c5c5cf;
                            font-size: 15px;
                            line-height: 26px;
                          ">
                            Este es tu primer correo real de
                            <strong style="color: #ffffff;">LumiXplore</strong>.
                            Un pequeño paso para empezar a descubrir
                            grandes historias.
                          </p>

                          <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                          >
                            <tr>
                              <td style="
                                padding: 18px 20px;
                                border: 1px solid #34303f;
                                border-radius: 14px;
                                background-color: #202029;
                              ">
                                <p style="
                                  margin: 0 0 6px;
                                  color: #b8ebd0;
                                  font-size: 14px;
                                  font-weight: 600;
                                  line-height: 22px;
                                ">
                                  Correo de prueba recibido
                                </p>

                                <p style="
                                  margin: 0;
                                  color: #b4b4c1;
                                  font-size: 13px;
                                  line-height: 22px;
                                ">
                                  Si puedes leer este mensaje, el envío
                                  a tu bandeja está funcionando.
                                </p>
                              </td>
                            </tr>
                          </table>

                          <p style="
                            margin: 26px 0 0;
                            color: #858592;
                            font-size: 12px;
                            line-height: 21px;
                          ">
                            Esta es una prueba técnica.
                            No necesitas confirmar nada ni responder.
                          </p>
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
                            style="border-radius: 4px; overflow: hidden;"
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
                      Películas, series y una historia para cada emoción.
                    </p>

                    <p style="
                      margin: 8px 0 0;
                      color: #646470;
                      font-size: 11px;
                      line-height: 20px;
                    ">
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
  `;
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const to = process.env.MAIL_TEST_TO;

  if (!apiKey || !from || !to) {
    throw new Error(
      "Falta RESEND_API_KEY, MAIL_FROM o MAIL_TEST_TO en backend/.env.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Tu primera conexión con LumiXplore",
      text: [
        "LumiXplore",
        "",
        "Ya estamos conectados.",
        "",
        "Este es tu primer correo real de LumiXplore.",
        "Esta es una prueba técnica. No necesitas confirmar nada ni responder.",
      ].join("\n"),
      html: buildEmail(),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(
      `Resend rechazó la solicitud: HTTP ${response.status}. Revisa su panel.`,
    );
  }

  console.log("Resend aceptó el correo. Revisa tu bandeja y spam.");
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Falló la prueba de correo.",
  );

  process.exitCode = 1;
});
