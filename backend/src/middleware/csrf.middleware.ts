import "dotenv/config";
import type { RequestHandler } from "express";

const origins = (process.env.CSRF_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (origins.length === 0) {
  throw new Error("Falta CSRF_ALLOWED_ORIGINS.");
}

for (const origin of origins) {
  const url = new URL(origin);

  if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin) {
    throw new Error("Origen inválido en CSRF_ALLOWED_ORIGINS.");
  }
}

const allowedOrigins = new Set(origins);

export const protectCsrf: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get("Origin");

  if (!origin || !allowedOrigins.has(origin)) {
    res.status(403).json({
      message: "Origen de la solicitud no permitido.",
    });
    return;
  }

  const contentType = req
    .get("Content-Type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    res.status(415).json({
      message: "La solicitud debe usar application/json.",
    });
    return;
  }

  next();
};
