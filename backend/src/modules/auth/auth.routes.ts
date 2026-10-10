import { Router } from "express";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { pool } from "../../db.js";
import { registerSchema, verifyEmailSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Revisa los datos del registro.",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const data = validation.data;

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const verificationToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const client = await pool.connect();
    let userId: string;

    try {
      await client.query("BEGIN");

      const result = await client.query<{ id: string }>(
        `INSERT INTO public.users
           (name, last_name, email, language, region, timezone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          data.name,
          data.last_name ?? null,
          data.email,
          data.language,
          data.region,
          data.timezone,
        ],
      );

      userId = result.rows[0]!.id;

      await client.query(
        `INSERT INTO public.auth_identities
           (user_id, provider, password_hash)
         VALUES ($1, 'local', $2)`,
        [userId, passwordHash],
      );

      await client.query(
        `INSERT INTO public.user_preferences (user_id)
         VALUES ($1)`,
        [userId],
      );

      await client.query(
        `INSERT INTO public.auth_tokens
           (user_id, purpose, token_hash, expires_at)
         VALUES (
           $1,
           'email_verification',
           $2,
           now() + interval '24 hours'
         )`,
        [userId, tokenHash],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // Solo para probar la verificación durante el desarrollo local.
    if (process.env.NODE_ENV === "development") {
      console.log("Token de verificación local:", verificationToken);
    }

    res.status(201).json({
      message: "Cuenta creada. Falta verificar el correo.",
      user: {
        id: userId,
        name: data.name,
        email: data.email,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505" &&
      "constraint" in error &&
      error.constraint === "users_email_unique"
    ) {
      res.status(409).json({
        message: "No se puede registrar una cuenta con ese correo.",
      });
      return;
    }

    next(error);
  }
});

authRouter.post("/verify-email", async (req, res, next) => {
  const validation = verifyEmailSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Token inválido.",
    });
    return;
  }

  try {
    const tokenHash = createHash("sha256")
      .update(validation.data.token)
      .digest("hex");

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Consume el token solo si sigue vigente y no fue usado.
      const result = await client.query<{ user_id: string }>(
        `UPDATE public.auth_tokens
         SET used_at = now()
         WHERE token_hash = $1
           AND purpose = 'email_verification'
           AND used_at IS NULL
           AND revoked_at IS NULL
           AND expires_at > now()
         RETURNING user_id`,
        [tokenHash],
      );

      const token = result.rows[0];

      if (!token) {
        await client.query("ROLLBACK");

        res.status(400).json({
          message: "El token es inválido, venció o ya fue utilizado.",
        });
        return;
      }

      await client.query(
        `UPDATE public.users
         SET email_verified_at = COALESCE(email_verified_at, now())
         WHERE id = $1`,
        [token.user_id],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.json({
      message: "Correo verificado. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    next(error);
  }
});
