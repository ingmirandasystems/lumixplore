import { rateLimit } from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Demasiados intentos. Intenta de nuevo más tarde.",
  },
});

export const tokenRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Demasiadas solicitudes. Intenta de nuevo más tarde.",
  },
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Demasiados registros. Intenta de nuevo más tarde.",
  },
});

export const tokenValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Demasiados intentos. Intenta de nuevo más tarde.",
  },
});
