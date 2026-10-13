import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),

  last_name: z.string().trim().min(1).max(100).optional(),

  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),

  password: z.string().min(15).max(128),

  language: z.enum(["es", "en"]).default("en"),

  region: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/),

  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(
      (value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      },
      { message: "Zona horaria inválida" },
    )
    .default("UTC"),
});

export const verifyEmailSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),

  password: z.string().min(1).max(128),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(15).max(128),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1).max(10000),
  language: registerSchema.shape.language,
  region: registerSchema.shape.region,
  timezone: registerSchema.shape.timezone,
});

export const updateLanguageSchema = z.object({
  language: z.enum(["es", "en"]),
});
