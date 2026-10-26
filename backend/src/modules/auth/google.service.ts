import "dotenv/config";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

export async function verifyGoogleCredential(credential: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Falta GOOGLE_CLIENT_ID en .env.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (
    !payload ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    throw new Error(
      "La credencial de Google no contiene los datos requeridos.",
    );
  }

  const email = payload.email.trim().toLowerCase();

  const googleConfirmsEmailOwnership =
    email.endsWith("@gmail.com") || Boolean(payload.hd);

  return {
    googleId: payload.sub,
    email,
    name: payload.given_name?.trim() || null,
    lastName: payload.family_name?.trim() || null,
    googleConfirmsEmailOwnership,
    issuedAt: payload.iat ?? null,
  };
}

export async function verifyGoogleAuthorizationCode(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!clientId || !clientSecret || !frontendUrl) {
    throw new Error("Falta configurar el acceso con Google.");
  }

  const client = new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: new URL(frontendUrl).origin,
  });

  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new Error("Google no devolvió una credencial de identidad.");
  }

  return verifyGoogleCredential(tokens.id_token);
}
