import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada.",
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  res.setHeader("Cache-Control", "no-store");

  const errorType =
    typeof error === "object" && error !== null && "type" in error
      ? error.type
      : undefined;

  if (errorType === "entity.parse.failed") {
    res.status(400).json({
      message: "El cuerpo de la solicitud contiene JSON inválido.",
    });
    return;
  }

  if (errorType === "entity.too.large") {
    res.status(413).json({
      message: "El cuerpo de la solicitud es demasiado grande.",
    });
    return;
  }

  console.error(
    "Error interno:",
    error instanceof Error ? error.message : "Error desconocido",
  );

  res.status(500).json({
    message: "Ocurrió un error interno. Intenta de nuevo más tarde.",
  });
};
