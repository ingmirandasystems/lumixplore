export async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  } catch {
    // Si no podemos leer el JSON, usamos el mensaje alternativo.
  }

  return fallback;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function readApiError(
  response: Response,
  fallback: string,
): Promise<ApiError> {
  let message = fallback;
  let code: string | null = null;

  try {
    const data: unknown = await response.json();

    if (typeof data === "object" && data !== null) {
      if ("message" in data && typeof data.message === "string") {
        message = data.message;
      }

      if ("code" in data && typeof data.code === "string") {
        code = data.code;
      }
    }
  } catch {
    // Conservamos los valores alternativos si no hay JSON válido.
  }

  return new ApiError(message, response.status, code);
}

export function getCommonErrorKey(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  switch (error.code) {
    case "RATE_LIMIT_EXCEEDED":
      return "errors.rateLimit";
    case "INTERNAL_SERVER_ERROR":
      return "errors.server";
    case "INVALID_JSON":
      return "errors.invalidJson";
    case "PAYLOAD_TOO_LARGE":
      return "errors.payloadTooLarge";
    case "ROUTE_NOT_FOUND":
      return "errors.routeNotFound";
  }

  // Respaldo para respuestas sin código, como las de un proxy.
  if (error.status === 429) {
    return "errors.rateLimit";
  }

  if (error.status >= 500 && error.status <= 599) {
    return "errors.server";
  }

  return fallback;
}
