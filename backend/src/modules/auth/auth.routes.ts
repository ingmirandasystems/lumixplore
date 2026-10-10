import { Router } from "express";
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";
import { pool } from "../../db.js";
import {
  registerSchema,
  verifyEmailSchema,
  loginSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas.js";

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

authRouter.post("/login", async (req, res, next) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Revisa el correo y la contraseña.",
    });
    return;
  }

  try {
    const { email, password } = validation.data;

    const result = await pool.query<{
      id: string;
      name: string;
      email: string;
      email_verified_at: Date | null;
      password_hash: string;
    }>(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.email_verified_at,
         a.password_hash
       FROM public.users AS u
       JOIN public.auth_identities AS a ON a.user_id = u.id
       WHERE lower(u.email) = $1
         AND a.provider = 'local'`,
      [email],
    );

    const user = result.rows[0];

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      res.status(401).json({
        message: "Correo o contraseña incorrectos.",
      });
      return;
    }

    if (!user.email_verified_at) {
      res.status(403).json({
        message: "Verifica tu correo antes de iniciar sesión.",
      });
      return;
    }

    const sessionToken = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    await pool.query(
      `INSERT INTO public.sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '90 days')`,
      [user.id, tokenHash],
    );

    res.cookie("lumixplore_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Sesión iniciada.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");

  const sessionToken: unknown = req.cookies?.lumixplore_session;

  if (
    typeof sessionToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(sessionToken)
  ) {
    res.status(401).json({
      message: "No hay una sesión válida.",
    });
    return;
  }

  try {
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    const result = await pool.query<{
      id: string;
      name: string;
      email: string;
      language: string;
      region: string;
      timezone: string;
    }>(
      `WITH active_session AS (
         UPDATE public.sessions
         SET last_seen_at = now()
         WHERE token_hash = $1
           AND revoked_at IS NULL
           AND expires_at > now()
           AND last_seen_at > now() - interval '30 days'
         RETURNING user_id
       )
       SELECT
         u.id,
         u.name,
         u.email,
         u.language,
         u.region,
         u.timezone
       FROM public.users AS u
       JOIN active_session AS s ON s.user_id = u.id`,
      [tokenHash],
    );

    const user = result.rows[0];

    if (!user) {
      res.clearCookie("lumixplore_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.status(401).json({
        message: "La sesión venció o fue cerrada.",
      });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");

  const sessionToken: unknown = req.cookies?.lumixplore_session;

  try {
    if (
      typeof sessionToken === "string" &&
      /^[a-f0-9]{64}$/.test(sessionToken)
    ) {
      const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

      await pool.query(
        `UPDATE public.sessions
         SET revoked_at = now()
         WHERE token_hash = $1
           AND revoked_at IS NULL`,
        [tokenHash],
      );
    }

    res.clearCookie("lumixplore_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.post("/resend-verification", async (req, res, next) => {
  const validation = resendVerificationSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Introduce un correo válido.",
    });
    return;
  }

  try {
    const client = await pool.connect();
    let verificationToken: string | undefined;

    try {
      await client.query("BEGIN");

      // Bloquea la cuenta para ordenar los reenvíos simultáneos.
      const result = await client.query<{
        id: string;
        email_verified_at: Date | null;
      }>(
        `SELECT u.id, u.email_verified_at
         FROM public.users AS u
         JOIN public.auth_identities AS a ON a.user_id = u.id
         WHERE lower(u.email) = $1
           AND a.provider = 'local'
         FOR UPDATE OF u`,
        [validation.data.email],
      );

      const user = result.rows[0];

      if (user && !user.email_verified_at) {
        verificationToken = randomBytes(32).toString("hex");

        const tokenHash = createHash("sha256")
          .update(verificationToken)
          .digest("hex");

        await client.query(
          `UPDATE public.auth_tokens
           SET revoked_at = now()
           WHERE user_id = $1
             AND purpose = 'email_verification'
             AND used_at IS NULL
             AND revoked_at IS NULL`,
          [user.id],
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
          [user.id, tokenHash],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    if (verificationToken && process.env.NODE_ENV === "development") {
      console.log("Nuevo token de verificación local:", verificationToken);
    }

    res.json({
      message:
        "Si la cuenta requiere verificación, se procesará un nuevo enlace.",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/forgot-password", async (req, res, next) => {
  const validation = forgotPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Introduce un correo válido.",
    });
    return;
  }

  try {
    const client = await pool.connect();
    let resetToken: string | undefined;

    try {
      await client.query("BEGIN");

      const result = await client.query<{ id: string }>(
        `SELECT u.id
         FROM public.users AS u
         JOIN public.auth_identities AS a ON a.user_id = u.id
         WHERE lower(u.email) = $1
           AND a.provider = 'local'
         FOR UPDATE OF u`,
        [validation.data.email],
      );

      const user = result.rows[0];

      if (user) {
        resetToken = randomBytes(32).toString("hex");

        const tokenHash = createHash("sha256").update(resetToken).digest("hex");

        await client.query(
          `UPDATE public.auth_tokens
           SET revoked_at = now()
           WHERE user_id = $1
             AND purpose = 'password_reset'
             AND used_at IS NULL
             AND revoked_at IS NULL`,
          [user.id],
        );

        await client.query(
          `INSERT INTO public.auth_tokens
             (user_id, purpose, token_hash, expires_at)
           VALUES (
             $1,
             'password_reset',
             $2,
             now() + interval '30 minutes'
           )`,
          [user.id, tokenHash],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    if (resetToken && process.env.NODE_ENV === "development") {
      console.log("Token de recuperación local:", resetToken);
    }

    res.json({
      message:
        "Si el correo corresponde a una cuenta local, se procesará un enlace de recuperación.",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  const validation = resetPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      message: "Revisa el token y la nueva contraseña.",
    });
    return;
  }

  try {
    const { token, password } = validation.data;

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Bloquea primero la cuenta, igual que forgot-password.
      const account = await client.query<{ id: string }>(
        `SELECT u.id
         FROM public.users AS u
         JOIN public.auth_tokens AS t ON t.user_id = u.id
         JOIN public.auth_identities AS a ON a.user_id = u.id
         WHERE t.token_hash = $1
           AND t.purpose = 'password_reset'
           AND a.provider = 'local'
         FOR UPDATE OF u`,
        [tokenHash],
      );

      const user = account.rows[0];

      if (!user) {
        await client.query("ROLLBACK");

        res.status(400).json({
          message: "El token es inválido, venció o ya fue utilizado.",
        });
        return;
      }

      const consumed = await client.query(
        `UPDATE public.auth_tokens
         SET used_at = now()
         WHERE token_hash = $1
           AND purpose = 'password_reset'
           AND used_at IS NULL
           AND revoked_at IS NULL
           AND expires_at > clock_timestamp()
         RETURNING id`,
        [tokenHash],
      );

      if (consumed.rowCount !== 1) {
        await client.query("ROLLBACK");

        res.status(400).json({
          message: "El token es inválido, venció o ya fue utilizado.",
        });
        return;
      }

      await client.query(
        `UPDATE public.auth_identities
         SET password_hash = $1
         WHERE user_id = $2 AND provider = 'local'`,
        [passwordHash, user.id],
      );

      await client.query(
        `UPDATE public.sessions
         SET revoked_at = now()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [user.id],
      );

      await client.query(
        `UPDATE public.auth_tokens
         SET revoked_at = now()
         WHERE user_id = $1
           AND purpose = 'password_reset'
           AND used_at IS NULL
           AND revoked_at IS NULL`,
        [user.id],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.json({
      message: "Contraseña actualizada. Inicia sesión nuevamente.",
    });
  } catch (error) {
    next(error);
  }
});
