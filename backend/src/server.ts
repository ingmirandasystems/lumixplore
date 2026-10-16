import "dotenv/config";
import express from "express";
import { pool } from "./db.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware.js";
import { fileURLToPath } from "node:url";
import { protectCsrf } from "./middleware/csrf.middleware.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { preferencesRouter } from "./modules/preferences/preferences.routes.js";
import { exploreRouter } from "./modules/explore/explore.routes.js";
import { watchlistRouter } from "./modules/watchlist/watchlist.routes.js";
import { searchRouter } from "./modules/search/search.routes.js";
import { moodsRouter } from "./modules/moods/moods.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use("/api", protectCsrf);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/catalog", catalogRouter);

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

if (process.env.NODE_ENV === "development") {
  app.get("/dev/google-test", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");

    res.sendFile(
      fileURLToPath(new URL("./dev/google-test.html", import.meta.url)),
    );
  });

  app.get("/dev/google-config", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");

    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      res.status(500).json({
        message: "Falta GOOGLE_CLIENT_ID.",
      });
      return;
    }

    res.json({ clientId });
  });
}
app.use("/api/preferences", preferencesRouter);
app.use("/api/explore", exploreRouter);
app.use("/api/watchlist", watchlistRouter);
app.use("/api/search", searchRouter);
app.use("/api/moods", moodsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, "127.0.0.1", () => {
  console.log(`Servidor disponible en http://localhost:${port}`);
});
