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
  googleLoginSchema,
  updateLanguageSchema,
  updateNameSchema,
  updateRegionSchema,
  changePasswordSchema,
} from "./auth.schemas.js";
import {
  loginLimiter,
  tokenRequestLimiter,
  registrationLimiter,
  tokenValidationLimiter,
  passwordChangeLimiter,
} from "./auth.limits.js";
import { requireAuth, type AuthUser } from "./auth.middleware.js";
import { sendAuthEmail } from "./auth.mail.js";
import { verifyGoogleCredential } from "./google.service.js";
import { getWatchRegions } from "../../services/tmdb.service.js";

export const authRouter = Router();

authRouter.post("/register", registrationLimiter, async (req, res, next) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_REGISTRATION_DATA",
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

    const regions = await getWatchRegions();

    if (!regions.some((region) => region.iso_3166_1 === data.region)) {
      res.status(400).json({
        code: "UNSUPPORTED_REGION",
        message: "Selecciona una región disponible.",
      });
      return;
    }

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
      await sendAuthEmail(
        data.email,
        verificationToken,
        "email_verification",
        data.language,
      );
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
        code: "EMAIL_UNAVAILABLE",
        message: "No se puede registrar una cuenta con ese correo.",
      });
      return;
    }

    next(error);
  }
});

authRouter.post(
  "/verify-email",
  tokenValidationLimiter,
  async (req, res, next) => {
    const validation = verifyEmailSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_VERIFICATION_TOKEN",
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
            code: "INVALID_VERIFICATION_TOKEN",
            message: "Token inválido.",
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
  },
);

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_LOGIN_DATA",
      message: "Revisa el correo y la contraseña.",
    });
    return;
  }

  try {
    const { email, password } = validation.data;
    const client = await pool.connect();

    let loggedInUser: {
      id: string;
      name: string;
      email: string;
    };

    let sessionToken: string;

    try {
      await client.query("BEGIN");

      // Usa el mismo bloqueo que reset-password.
      const account = await client.query<{ id: string }>(
        `SELECT id
         FROM public.users
         WHERE lower(email) = $1
         FOR UPDATE`,
        [email],
      );

      const accountUser = account.rows[0];

      if (!accountUser) {
        await client.query("ROLLBACK");

        res.status(401).json({
          code: "INVALID_CREDENTIALS",
          message: "Correo o contraseña incorrectos.",
        });
        return;
      }

      // Lee las credenciales después de obtener el bloqueo.
      const result = await client.query<{
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
         WHERE u.id = $1
           AND a.provider = 'local'`,
        [accountUser.id],
      );

      const user = result.rows[0];

      if (!user || !(await argon2.verify(user.password_hash, password))) {
        await client.query("ROLLBACK");

        res.status(401).json({
          code: "INVALID_CREDENTIALS",
          message: "Correo o contraseña incorrectos.",
        });
        return;
      }

      if (!user.email_verified_at) {
        await client.query("ROLLBACK");

        res.status(403).json({
          code: "EMAIL_NOT_VERIFIED",
          message: "Verifica tu correo antes de iniciar sesión.",
        });
        return;
      }

      sessionToken = randomBytes(32).toString("hex");

      const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

      await client.query(
        `INSERT INTO public.sessions
           (user_id, token_hash, expires_at)
         VALUES ($1, $2, clock_timestamp() + interval '90 days')`,
        [user.id, tokenHash],
      );

      await client.query("COMMIT");

      loggedInUser = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.cookie("lumixplore_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Sesión iniciada.",
      user: loggedInUser,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (_req, res) => {
  res.json({
    user: res.locals.user,
  });
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

authRouter.post(
  "/resend-verification",
  tokenRequestLimiter,
  async (req, res, next) => {
    const validation = resendVerificationSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_EMAIL",
        message: "Introduce un correo válido.",
      });
      return;
    }

    try {
      const client = await pool.connect();
      let verificationToken: string | undefined;
      let emailLanguage = "en";

      try {
        await client.query("BEGIN");

        // Bloquea la cuenta para ordenar los reenvíos simultáneos.
        const result = await client.query<{
          id: string;
          email_verified_at: Date | null;
          language: string;
        }>(
          `SELECT u.id, u.email_verified_at, u.language
            FROM public.users AS u
            JOIN public.auth_identities AS a ON a.user_id = u.id
            WHERE lower(u.email) = $1
              AND a.provider = 'local'
            FOR UPDATE OF u`,
          [validation.data.email],
        );

        const user = result.rows[0];

        if (user && !user.email_verified_at) {
          emailLanguage = user.language;
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
        await sendAuthEmail(
          validation.data.email,
          verificationToken,
          "email_verification",
          emailLanguage,
        );
      }

      res.json({
        message:
          "Si la cuenta requiere verificación, se procesará un nuevo enlace.",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/forgot-password",
  tokenRequestLimiter,
  async (req, res, next) => {
    const validation = forgotPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_EMAIL",
        message: "Introduce un correo válido.",
      });
      return;
    }

    try {
      const client = await pool.connect();
      let resetToken: string | undefined;
      let emailLanguage = "en";

      try {
        await client.query("BEGIN");

        const result = await client.query<{ id: string; language: string }>(
          `SELECT u.id, u.language
            FROM public.users AS u
            JOIN public.auth_identities AS a ON a.user_id = u.id
            WHERE lower(u.email) = $1
              AND a.provider = 'local'
            FOR UPDATE OF u`,
          [validation.data.email],
        );

        const user = result.rows[0];

        if (user) {
          emailLanguage = user.language;
          resetToken = randomBytes(32).toString("hex");

          const tokenHash = createHash("sha256")
            .update(resetToken)
            .digest("hex");

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
        await sendAuthEmail(
          validation.data.email,
          resetToken,
          "password_reset",
          emailLanguage,
        );
      }

      res.json({
        message:
          "Si el correo corresponde a una cuenta local, se procesará un enlace de recuperación.",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/reset-password",
  tokenValidationLimiter,
  async (req, res, next) => {
    const validation = resetPasswordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_PASSWORD_RESET_DATA",
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
            code: "PASSWORD_RESET_TOKEN_UNAVAILABLE",
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
            code: "PASSWORD_RESET_TOKEN_UNAVAILABLE",
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
  },
);

authRouter.post("/google", loginLimiter, async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");

  const validation = googleLoginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_GOOGLE_LOGIN_DATA",
      message: "Revisa los datos del acceso con Google.",
    });
    return;
  }

  const data = validation.data;

  if (!process.env.GOOGLE_CLIENT_ID) {
    next(new Error("Falta GOOGLE_CLIENT_ID."));
    return;
  }

  let googleUser: Awaited<ReturnType<typeof verifyGoogleCredential>>;

  try {
    googleUser = await verifyGoogleCredential(data.credential);
  } catch {
    res.status(401).json({
      code: "INVALID_GOOGLE_CREDENTIAL",
      message: "No se pudo validar la credencial de Google.",
    });
    return;
  }

  if (!googleUser.googleConfirmsEmailOwnership) {
    res.status(403).json({
      code: "GOOGLE_EMAIL_VERIFICATION_REQUIRED",
      message:
        "El acceso con este correo externo aún requiere implementar una verificación adicional.",
    });
    return;
  }

  try {
    const client = await pool.connect();

    let user: {
      id: string;
      name: string;
      email: string;
    };

    let sessionToken: string;

    try {
      await client.query("BEGIN");

      const existing = await client.query<{
        id: string;
        name: string;
        email: string;
      }>(
        `SELECT u.id, u.name, u.email
         FROM public.users AS u
         JOIN public.auth_identities AS a ON a.user_id = u.id
         WHERE a.provider = 'google'
           AND a.provider_subject = $1
         FOR UPDATE OF u`,
        [googleUser.googleId],
      );

      const existingUser = existing.rows[0];

      if (existingUser) {
        user = existingUser;
      } else {
        const regions = await getWatchRegions();

        if (!regions.some((region) => region.iso_3166_1 === data.region)) {
          await client.query("ROLLBACK");

          res.status(400).json({
            code: "UNSUPPORTED_REGION",
            message: "Selecciona una región disponible.",
          });
          return;
        }

        const created = await client.query<{
          id: string;
          name: string;
          email: string;
        }>(
          `INSERT INTO public.users
             (
               name, last_name, email, language,
               region, timezone, email_verified_at
             )
           VALUES ($1, $2, $3, $4, $5, $6, now())
           RETURNING id, name, email`,
          [
            googleUser.name ?? "Usuario",
            googleUser.lastName,
            googleUser.email,
            data.language,
            data.region,
            data.timezone,
          ],
        );

        user = created.rows[0]!;

        await client.query(
          `INSERT INTO public.auth_identities
             (user_id, provider, provider_subject)
           VALUES ($1, 'google', $2)`,
          [user.id, googleUser.googleId],
        );

        await client.query(
          `INSERT INTO public.user_preferences (user_id)
           VALUES ($1)`,
          [user.id],
        );
      }

      sessionToken = randomBytes(32).toString("hex");

      const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

      await client.query(
        `INSERT INTO public.sessions
           (user_id, token_hash, expires_at)
         VALUES ($1, $2, clock_timestamp() + interval '90 days')`,
        [user.id, tokenHash],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    res.cookie("lumixplore_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Sesión iniciada con Google.",
      user,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({
        code: "GOOGLE_ACCOUNT_CONFLICT",
        message:
          "No se pudo crear la cuenta. Si ya tienes una, usa su método de acceso; si enviaste dos solicitudes simultáneas, intenta de nuevo.",
      });
      return;
    }

    next(error);
  }
});

authRouter.patch("/language", requireAuth, async (_req, res, next) => {
  const validation = updateLanguageSchema.safeParse(_req.body);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_LANGUAGE",
      message: "Selecciona un idioma válido.",
    });
    return;
  }

  try {
    const result = await pool.query<AuthUser>(
      `UPDATE public.users
         SET language = $1
         WHERE id = $2
         RETURNING id, name, email, language, region, timezone`,
      [validation.data.language, res.locals.user.id],
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({
        code: "SESSION_INVALID",
        message: "No hay una sesión válida.",
      });
      return;
    }

    res.json({
      user: {
        ...user,
        hasLocalPassword: res.locals.user.hasLocalPassword,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.patch("/name", requireAuth, async (req, res, next) => {
  if (!res.locals.user.hasLocalPassword) {
    res.status(403).json({
      code: "NAME_EDIT_NOT_ALLOWED",
      message: "Esta cuenta no permite editar el nombre.",
    });
    return;
  }

  const validation = updateNameSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      code: "INVALID_NAME",
      message: "Introduce un nombre de entre 1 y 100 caracteres.",
    });
    return;
  }

  try {
    const result = await pool.query<AuthUser>(
      `UPDATE public.users
       SET name = $1
       WHERE id = $2
       RETURNING id, name, email, language, region, timezone`,
      [validation.data.name, res.locals.user.id],
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({
        code: "SESSION_INVALID",
        message: "No hay una sesión válida.",
      });
      return;
    }

    res.json({
      user: {
        ...user,
        hasLocalPassword: res.locals.user.hasLocalPassword,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.patch("/region", requireAuth, async (req, res, next) => {
  const validation = updateRegionSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      code: "UNSUPPORTED_REGION",
      message: "Selecciona una región disponible.",
    });
    return;
  }

  try {
    const regions = await getWatchRegions();

    if (
      !regions.some((region) => region.iso_3166_1 === validation.data.region)
    ) {
      res.status(400).json({
        code: "UNSUPPORTED_REGION",
        message: "Selecciona una región disponible.",
      });
      return;
    }

    const result = await pool.query<AuthUser>(
      `UPDATE public.users
       SET region = $1
       WHERE id = $2
       RETURNING id, name, email, language, region, timezone`,
      [validation.data.region, res.locals.user.id],
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({
        code: "SESSION_INVALID",
        message: "No hay una sesión válida.",
      });
      return;
    }

    res.json({
      user: {
        ...user,
        hasLocalPassword: res.locals.user.hasLocalPassword,
      },
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post(
  "/change-password",
  passwordChangeLimiter,
  requireAuth,
  async (req, res, next) => {
    const validation = changePasswordSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        code: "INVALID_PASSWORD_CHANGE_DATA",
        message: "Revisa la contraseña actual y la nueva contraseña.",
      });
      return;
    }

    try {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        // Coordina el cambio con login y recuperación de contraseña.
        await client.query(
          `SELECT id FROM public.users WHERE id = $1 FOR UPDATE`,
          [res.locals.user.id],
        );

        const tokenHash = createHash("sha256")
          .update(req.cookies.lumixplore_session)
          .digest("hex");

        // Comprueba que la sesión siga activa después de obtener el bloqueo.
        const session = await client.query(
          `SELECT id FROM public.sessions
           WHERE user_id = $1
             AND token_hash = $2
             AND revoked_at IS NULL
             AND expires_at > clock_timestamp()
             AND last_seen_at > clock_timestamp() - interval '30 days'`,
          [res.locals.user.id, tokenHash],
        );

        if (session.rowCount !== 1) {
          await client.query("ROLLBACK");
          res.status(401).json({
            code: "SESSION_INVALID",
            message: "La sesión venció o fue cerrada.",
          });
          return;
        }

        const result = await client.query<{ password_hash: string }>(
          `SELECT password_hash FROM public.auth_identities
           WHERE user_id = $1 AND provider = 'local'`,
          [res.locals.user.id],
        );

        const identity = result.rows[0];

        if (!identity) {
          await client.query("ROLLBACK");
          res.status(403).json({
            code: "PASSWORD_CHANGE_NOT_ALLOWED",
            message: "Esta cuenta no tiene una contraseña local.",
          });
          return;
        }

        const { currentPassword, newPassword } = validation.data;

        if (!(await argon2.verify(identity.password_hash, currentPassword))) {
          await client.query("ROLLBACK");
          res.status(403).json({
            code: "CURRENT_PASSWORD_INCORRECT",
            message: "La contraseña actual es incorrecta.",
          });
          return;
        }

        const passwordHash = await argon2.hash(newPassword, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        });

        await client.query(
          `UPDATE public.auth_identities SET password_hash = $1
           WHERE user_id = $2 AND provider = 'local'`,
          [passwordHash, res.locals.user.id],
        );

        await client.query(
          `UPDATE public.sessions SET revoked_at = now()
           WHERE user_id = $1 AND revoked_at IS NULL`,
          [res.locals.user.id],
        );

        await client.query(
          `UPDATE public.auth_tokens SET revoked_at = now()
           WHERE user_id = $1
             AND purpose = 'password_reset'
             AND used_at IS NULL
             AND revoked_at IS NULL`,
          [res.locals.user.id],
        );

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      res.clearCookie("lumixplore_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);
