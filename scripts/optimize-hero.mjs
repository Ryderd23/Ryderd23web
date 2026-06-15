import sharp from "sharp";
import { statSync } from "fs";

const src = "public/assets/hero-bg.png";
const meta = await sharp(src).metadata();
console.log(`Origen: ${meta.width}×${meta.height}`);

await sharp(src)
  .resize(2560, null, { fit: "inside", withoutEnlargement: false })
  .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.35 })
  .webp({ quality: 90, effort: 6, smartSubsample: true })
  .toFile("public/assets/hero-bg.webp");

await sharp(src)
  .resize(2560, null, { fit: "inside", withoutEnlargement: false })
  .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.35 })
  .webp({ quality: 82, effort: 6 })
  .resize(1280, null, { fit: "inside" })
  .toFile("public/assets/hero-bg-mobile.webp");

const desktop = statSync("public/assets/hero-bg.webp").size;
const mobile = statSync("public/assets/hero-bg-mobile.webp").size;
const out = await sharp("public/assets/hero-bg.webp").metadata();
console.log(`hero-bg.webp → ${out.width}×${out.height} (${Math.round(desktop / 1024)} KB)`);
console.log(`hero-bg-mobile.webp → ${Math.round(mobile / 1024)} KB`);
