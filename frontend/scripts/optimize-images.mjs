import sharp from "sharp";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const assetsDirectory = new URL("../src/assets/icons/", import.meta.url);

const images = [
  {
    name: "land-page__img",
    width: 2560,
  },
  {
    name: "land-page__films",
    width: 3200,
  },
  {
    name: "land-films__mobile",
    width: 1920,
  },
  {
    name: "land-lumicard__bg",
    width: 3200,
  },
];

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  let originalTotal = 0;
  let optimizedTotal = 0;

  for (const image of images) {
    const input = fileURLToPath(new URL(`${image.name}.png`, assetsDirectory));

    const output = fileURLToPath(
      new URL(`${image.name}.webp`, assetsDirectory),
    );

    await sharp(input)
      .resize({
        width: image.width,
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        alphaQuality: 100,
        effort: 6,
      })
      .toFile(output);

    const original = await stat(input);
    const optimized = await stat(output);

    originalTotal += original.size;
    optimizedTotal += optimized.size;

    const reduction = ((1 - optimized.size / original.size) * 100).toFixed(1);

    console.log(
      `${image.name}: ${formatSize(original.size)} → ` +
        `${formatSize(optimized.size)} (${reduction}% menos)`,
    );
  }

  console.log("");
  console.log(
    `Total: ${formatSize(originalTotal)} → ${formatSize(optimizedTotal)}`,
  );
}

main().catch((error) => {
  console.error("No se pudieron optimizar las imágenes:", error);
  process.exitCode = 1;
});
