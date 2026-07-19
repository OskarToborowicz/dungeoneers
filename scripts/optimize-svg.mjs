// Optimize monster silhouette SVGs in place with SVGO (precision=2).
//
// Only touches RAW Inkscape exports — SVGO strips the `inkscape:`/`sodipodi:`
// namespaces when it optimizes, so an already-processed file no longer carries
// them and is skipped. Drop a fresh Inkscape SVG into src/assets/monsters/ and
// run `npm run optimize-svg`; files already slimmed stay byte-for-byte the same.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";

const dir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "assets",
  "monsters",
);

const isRawExport = (svg) => /inkscape:|sodipodi:/.test(svg);
const kb = (bytes) => (bytes / 1024).toFixed(0);

const files = readdirSync(dir).filter((f) => f.endsWith(".svg"));
let processed = 0;
let skipped = 0;
let before = 0;
let after = 0;

for (const file of files) {
  const path = join(dir, file);
  const src = readFileSync(path, "utf8");
  if (!isRawExport(src)) {
    skipped += 1;
    continue;
  }
  const origBytes = Buffer.byteLength(src);
  const { data } = optimize(src, { path, floatPrecision: 2 });
  writeFileSync(path, data);
  const newBytes = Buffer.byteLength(data);
  before += origBytes;
  after += newBytes;
  processed += 1;
  console.log(`  ${file}: ${kb(origBytes)}KB -> ${kb(newBytes)}KB`);
}

console.log(
  `\nOptimized ${processed}, skipped ${skipped} (already optimized).`,
);
if (processed) {
  console.log(
    `Total: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB`,
  );
}
