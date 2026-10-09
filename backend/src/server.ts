import "dotenv/config";
import express from "express";
import { pool } from "./db.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

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

app.listen(port, "127.0.0.1", () => {
  console.log(`Servidor disponible en http://localhost:${port}`);
});
