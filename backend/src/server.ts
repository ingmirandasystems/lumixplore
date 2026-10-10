import "dotenv/config";
import express from "express";
import { pool } from "./db.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      app: "LumiXplore",
      database: "connected",
    });
  } catch (error) {
    console.error("No se pudo conectar con PostgreSQL:", error);

    res.status(503).json({
      status: "error",
      database: "unavailable",
    });
  }
});
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, "127.0.0.1", () => {
  console.log(`Servidor disponible en http://localhost:${port}`);
});
