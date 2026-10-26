import "dotenv/config";
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function createTestMailer() {
  const account = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  return {
    transporter,
    from: `"LumiXplore" <${account.user}>`,
  };
}

let mailerPromise: ReturnType<typeof createTestMailer> | undefined;

async function sendTestEmail(options: EmailOptions): Promise<void> {
  mailerPromise ??= createTestMailer();

  let mailer: Awaited<ReturnType<typeof createTestMailer>>;

  try {
    mailer = await mailerPromise;
  } catch (error) {
    mailerPromise = undefined;
    throw error;
  }

  const info = await mailer.transporter.sendMail({
    from: mailer.from,
    ...options,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (previewUrl) {
    console.log("Vista previa del correo:", previewUrl);
  }
}

async function sendProductionEmail(options: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Falta configurar RESEND_API_KEY o MAIL_FROM.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      ...(options.html ? { html: options.html } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // No imprimimos el contenido del correo ni sus enlaces privados.
    throw new Error(
      `El proveedor rechazó el envío de correo: HTTP ${response.status}.`,
    );
  }
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    await sendTestEmail(options);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    await sendProductionEmail(options);
    return;
  }

  throw new Error(
    "Configura NODE_ENV como development o production para enviar correos.",
  );
}
