import "dotenv/config";
import nodemailer from "nodemailer";

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

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("El correo de producción aún no está configurado.");
  }

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
