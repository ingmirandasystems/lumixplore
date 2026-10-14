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
