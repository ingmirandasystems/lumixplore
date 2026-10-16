import "dotenv/config";
import { searchKeywords } from "../services/tmdb.service.js";

async function main() {
  const terms = [
    "heist",
    "chase",
    "survival",
    "space travel",
    "magic",
    "dystopia",
    "time travel",
    "moral dilemma",
    "obsession",
    "ambition",
    "psychological drama",
  ];

  const results = await Promise.all(
    terms.map(async (term) => ({
      term,
      data: await searchKeywords(term),
    })),
  );

  for (const { term, data } of results) {
    console.log(`\nBúsqueda: ${term}`);
    console.table(data.results);
    console.log(`Páginas disponibles: ${data.total_pages}`);
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "No se pudieron buscar las palabras clave",
  );

  process.exitCode = 1;
});
