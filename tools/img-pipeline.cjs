// tools/img-pipeline.js (CommonJS version)
// Batch convert all JPG/PNG under /public → AVIF + WebP responsive sets

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = "public";
const OUTSIZES = [480, 768, 1080, 1600];

const isImg = f => /\.(jpe?g|png)$/i.test(f);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(ROOT).filter(isImg);
if (!files.length) {
  console.log("No JPG/PNG found under /public");
  process.exit(0);
}

(async () => {
  for (const file of files) {
    const { dir, name } = path.parse(file);
    const buf = fs.readFileSync(file);

    for (const w of OUTSIZES) {
      await sharp(buf)
        .resize({ width: w })
        .avif({ quality: 45 })
        .toFile(path.join(dir, `${name}-${w}.avif`));

      await sharp(buf)
        .resize({ width: w })
        .webp({ quality: 70 })
        .toFile(path.join(dir, `${name}-${w}.webp`));
    }

    // fallback JPG (1600px wide)
    await sharp(buf)
      .resize({ width: 1600 })
      .toFile(path.join(dir, `${name}-1600.jpg`));

    console.log("✅ Processed:", file);
  }

  console.log("\nUse in HTML like:\n");
  console.log(`<picture>
  <source type="image/avif" srcset="/img/hero-large-480.avif 480w, 
/img/hero-large-768.avif 768w, /img/hero-large-1080.avif 1080w, 
/img/hero-large-1600.avif 1600w" sizes="(max-width: 768px) 100vw, 768px"/>
  <source type="image/webp" srcset="/img/hero-large-480.webp 480w, 
/img/hero-large-768.webp 768w, /img/hero-large-1080.webp 1080w, 
/img/hero-large-1600.webp 1600w" sizes="(max-width: 768px) 100vw, 768px"/>
  <img src="/img/hero-large-1600.jpg" width="1600" height="900" alt="Hero" 
loading="eager" fetchpriority="high" style="aspect-ratio:1600/900">
</picture>`);
})();

