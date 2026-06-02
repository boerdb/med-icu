import { mkdirSync, readFileSync } from "fs";
import sharp from "sharp";

mkdirSync("public/icons", { recursive: true });

const svg = readFileSync("public/icon.svg");

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`Created icon-${size}.png`);
}

await sharp(svg)
  .resize(410, 410)
  .png()
  .extend({
    top: 51,
    bottom: 51,
    left: 51,
    right: 51,
    background: { r: 30, g: 64, b: 175, alpha: 1 },
  })
  .toFile("public/icons/icon-512-maskable.png");
console.log("Created icon-512-maskable.png");
