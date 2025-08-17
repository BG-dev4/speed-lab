// batch: convert every jpg/png in public/ to AVIF+WebP and build srcset 
sizes
// usage: node tools/img-pipeline.js
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = "public";
const OUTSIZES = [480, 768, 1080, 1600];

const isImg = f => /\.(jpe?g|png)$/i.test(f);
const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });

const files = walk(ROOT).filter(isImg);
if (!files.length) { console.log("No JPG/PNG found under /public"); 
process.exit(0); }

for (const file of files) {
  const { dir, name } = path.parse(file);
  const buf = fs.readFileSync(file);
  for (const w of OUTSIZES) {
    await sharp(buf).resize({ width: w }).avif({ quality: 45 
}).toFile(path.join(dir, `${name}-${w}.avif`));
    await sharp(buf).resize({ width: w }).webp({ quality: 70 
}).toFile(path.join(dir, `${name}-${w}.webp`));
  }
  // also keep a 1600 “original-ish” for LCP
  await sharp(buf).resize({ width: 1600 }).toFile(path.join(dir, 
`${name}-1600.jpg`));
  console.log("ok:", file);
}

console.log("\nUSAGE NOTE:");
console.log(`Use <picture> with srcset like:
<picture>
 <source type="image/avif" srcset="/path/name-480.avif 480w, 
/path/name-768.avif 768w, /path/name-1080.avif 1080w, /path/name-1600.avif 
1600w" sizes="(max-width: 768px) 100vw, 768px"/>
 <source type="image/webp" srcset="/path/name-480.webp 480w, 
/path/name-768.webp 768w, /path/name-1080.webp 1080w, /path/name-1600.webp 
1600w" sizes="(max-width: 768px) 100vw, 768px"/>
 <img src="/path/name-1600.jpg" width="1600" height="900" loading="eager" 
fetchpriority="high" style="aspect-ratio:1600/900" alt="">
</picture>`);

