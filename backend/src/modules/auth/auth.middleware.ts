import type { RequestHandler } from "express";
import { createHash } from "node:crypto";
import { pool } from "../../db.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  language: string;
  region: string;
  timezone: string;
  hasLocalPassword: boolean;
};

export const requireAuth: RequestHandler<
  Record<string, string>,
  unknown,
  unknown,
  Record<string, unknown>,
  { user: AuthUser }
> = async (req, res, next) => {
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

    const result = await pool.query<AuthUser>(
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
         u.timezone,
          EXISTS (
            SELECT 1
            FROM public.auth_identities AS a
            WHERE a.user_id = u.id
              AND a.provider = 'local'
              AND a.password_hash IS NOT NULL
          ) AS "hasLocalPassword"
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

    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
