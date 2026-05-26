import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function countPngFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) n += countPngFiles(p);
    else if (ent.name.endsWith(".png")) n += 1;
  }
  return n;
}

// Canonical marketing homepage at site root (ePAI narrative — not the React app).
fs.copyFileSync(
  path.join(root, "index.html"),
  path.join(dist, "index.html")
);

// PanTS Atlas PNG stacks + catalog JSON + shared assets at same relative URLs.
copyDir(path.join(root, "assets"), path.join(dist, "assets"));
// demo/index.html is built by Vite (React Sample Viewer); do not overwrite with source copy.

const dbFiles = [
  "caseIndex.json",
  "pantsAtlasDatabase.json",
  "organSchema.json",
];
const dbSrc = path.join(root, "assets", "pants-atlas", "database");
const dbDist = path.join(dist, "assets", "pants-atlas", "database");
let dbOk = true;
for (const f of dbFiles) {
  const src = path.join(dbSrc, f);
  const dest = path.join(dbDist, f);
  if (!fs.existsSync(src)) {
    console.warn(`Warning: missing ${src}`);
    dbOk = false;
  } else if (!fs.existsSync(dest)) {
    console.warn(`Warning: ${f} not copied to dist — check assets/pants-atlas/database/`);
    dbOk = false;
  }
}

const casesSrc = path.join(root, "assets", "pants-atlas", "cases");
const casesDist = path.join(dist, "assets", "pants-atlas", "cases");
const srcPng = countPngFiles(casesSrc);
const distPng = countPngFiles(casesDist);

if (dbOk) {
  console.log("PanTS Atlas database JSON verified under dist/assets/pants-atlas/database/");
} else {
  console.warn(
    "Warning: atlas database incomplete — run scripts/sync_pants_atlas_database.py and scripts/export_pants_atlas_png.py"
  );
}

if (srcPng > 0 && srcPng === distPng) {
  console.log(`PanTS Atlas PNG stacks copied: ${distPng} files under dist/assets/pants-atlas/cases/`);
} else if (srcPng === 0) {
  console.warn(
    "Warning: assets/pants-atlas/cases has no PNGs — run scripts/export_pants_atlas_png.py before deploy"
  );
} else {
  console.warn(
    `Warning: PNG count mismatch (src ${srcPng} vs dist ${distPng}) — verify assets/pants-atlas/cases copy`
  );
}
