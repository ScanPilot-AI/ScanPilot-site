# ScanPilot Static Site

Investor-facing marketing site plus a separate **interactive CT-PDAC Review Console** at `demo/#viewer` (PanTS static exports).

## Run locally

**Full site (recommended)** — marketing homepage, sample viewer, and Infrastructure Console:

```bash
npm install
npm run dev
```

If port 5173 is already in use, stop the old Vite process (`Ctrl+C` in that terminal, or `lsof -ti:5173 | xargs kill`) so dev always runs on **5173**. A stale server on 5173 can show a blank white `/product/` page.

- Homepage: `http://localhost:5173/`
- Sample CT Viewer: `http://localhost:5173/demo/#viewer`
- Infrastructure Console: `http://localhost:5173/product/`

**Product app only** (faster HMR while editing React):

```bash
npm run dev:product
```

**Production preview** (after `npm run build`):

```bash
npm run preview
```

- Mirrors GitHub Pages layout under `dist/`

**Static-only fallback** (no React HMR):

```bash
python3 -m http.server 8080
```

Use `http://` (not `file://`) so pages can `fetch()` JSON under `assets/data/`.

## Project structure

```txt
oncoshield-site/
  index.html
  demo/index.html
  assets/
    css/style.css, demo-page.css
    js/demo-page.js
    data/demoCases.json
    demo-cases/          # PNG stacks from export script
    images/              # hero-ct, ct-evidence, validation-results, reader-study, etc.
  scripts/
    export_oncoshield_demo_assets.py
    requirements-demo-export.txt
```

## PanTS Atlas (two-tier database)

| Tier | File | Count |
|------|------|-------|
| Metadata catalog | `assets/data/pantsCatalog.json` | 9,901 cases from `metadata.xlsx` |
| Local volumes | `assets/data/pantsLocalAtlas.json` + `assets/pants-atlas/` PNGs | 5 bundled CT cases |
| Summary | `assets/data/pantsAtlasSummary.json` | Aggregated stats |

Regenerate (requires `PanTS-Viewer/PanTS/data/` on disk — not committed to deploy):

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements-demo-export.txt
.venv/bin/python scripts/build_pants_atlas_database.py
.venv/bin/python scripts/export_pants_atlas_png.py   # if PNGs missing
.venv/bin/python scripts/audit_pants_atlas_assets.py
npm run build
```

**Deploy:** Commit `assets/data/pants*.json` and `assets/pants-atlas/` (~13MB PNGs). Metadata-only catalog cases open a detail drawer; only local-volume cases load CT in the viewer.

## Regenerating legacy demo slices

```bash
.venv/bin/python scripts/export_oncoshield_demo_assets.py
```

## Compliance

Research/product demo positioning on the marketing site. Not for diagnosis or patient-care decisions. Assistive second-read design—not autonomous diagnosis. Not FDA cleared.
