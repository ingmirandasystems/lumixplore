import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool();

pool.on("error", (error) => {
  console.error("Error en una conexión de PostgreSQL:", error.message);
});
