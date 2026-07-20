// Optimize silhouette SVGs in place with SVGO (precision=2).
//
// Covers both monster art (src/assets/monsters/, flat) and per-class skill art
// (src/assets/skills/<class>/<slot>/, nested). Only touches RAW Inkscape
// exports — SVGO strips the `inkscape:`/`sodipodi:` namespaces when it
// optimizes, so an already-processed file no longer carries them and is
// skipped. Drop a fresh Inkscape SVG anywhere under those folders and run
// `npm run optimize-svg`; files already slimmed stay byte-for-byte the same.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";

const assets = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "assets");

// Recursively collect every .svg under a directory.
function collect(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...collect(path));
    else if (entry.endsWith(".svg")) out.push(path);
  }
  return out;
}

const isRawExport = (svg) => /inkscape:|sodipodi:/.test(svg);
const kb = (bytes) => (bytes / 1024).toFixed(0);

const files = [
  ...collect(join(assets, "monsters")),
  ...collect(join(assets, "skills")),
];

let processed = 0;
let skipped = 0;
let before = 0;
let after = 0;

for (const path of files) {
  const src = readFileSync(path, "utf8");
  if (!isRawExport(src)) {
    skipped += 1;
    continue;
  }
  const origBytes = Buffer.byteLength(src);
  if (/data:image\/(png|jpe?g|gif|webp);base64/.test(src)) {
    console.warn(
      `  ! ${path.slice(assets.length + 1)}: embeds a raster bitmap (${kb(origBytes)}KB) — export as vector paths instead; skipped`,
    );
    skipped += 1;
    continue;
  }
  let data;
  try {
    ({ data } = optimize(src, { path, floatPrecision: 2 }));
  } catch (err) {
    console.warn(`  ! ${path.slice(assets.length + 1)}: SVGO failed (${err.message}); skipped`);
    skipped += 1;
    continue;
  }
  writeFileSync(path, data);
  const newBytes = Buffer.byteLength(data);
  before += origBytes;
  after += newBytes;
  processed += 1;
  const rel = path.slice(assets.length + 1);
  console.log(`  ${rel}: ${kb(origBytes)}KB -> ${kb(newBytes)}KB`);
}

console.log(`\nOptimized ${processed}, skipped ${skipped} (already optimized).`);
if (processed) {
  console.log(
    `Total: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB`,
  );
}
