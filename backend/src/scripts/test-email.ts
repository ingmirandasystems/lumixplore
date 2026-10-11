import { sendEmail } from "../services/mail.service.js";

try {
  await sendEmail({
    to: "alejandro@example.com",
    subject: "Prueba de correo — LumiXplore",
    text: "El envío de correos de prueba funciona.",
    html: `
      <h1>LumiXplore</h1>
      <p>El envío de correos de prueba funciona.</p>
    `,
  });
} catch (error) {
  console.error(
    "Falló el envío:",
    error instanceof Error ? error.message : "Error desconocido",
  );

  process.exitCode = 1;
}
