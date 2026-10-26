import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("Falta configurar DATABASE_URL en backend/.env.");
}

export const pool = new Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (error) => {
  console.error("Error en una conexión de PostgreSQL:", error.message);
});
