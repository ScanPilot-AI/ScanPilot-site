# PanTS-Viewer extraction inventory

Internal development reference for aligning **ScanPilot-site** static demo with the **PanTS-Viewer** prototype. Not linked from the public marketing site.

## 1. Sample cases (PanTS IDs)

Static demo exports and PanTS-style identifiers used in this repo:

| Case ID        | Notes                          |
|----------------|--------------------------------|
| PanTS_00000001 | Primary sample in static demo  |
| PanTS_00000017 |                                |
| PanTS_00000030 |                                |
| PanTS_00000035 |                                |
| PanTS_00000121 |                                |

Additional training-style paths under `PanTS-Viewer/PanTS/data/` (ImageTr / LabelTr) exist in the upstream layout when the full PanTS tree is present; the Vite demo uses HuggingFace / session workflows rather than shipping full volumes in this snapshot.

## 2. Available data per case (flask-server / PanTS conventions)

From `PanTS-Viewer/flask-server/constants.py` and related services:

| Asset / artifact            | Typical filename / role                          |
|-----------------------------|--------------------------------------------------|
| CT volume                   | `ct.nii.gz` (`MAIN_NIFTI_FILENAME`)              |
| Compressed CT               | `ct.npz` (`MAIN_NPZ_FILENAME`)                   |
| Combined multi-class labels | `combined_labels.npz`, `combined_labels.nii.gz` |
| Organ intensities           | `organ_intensities.json` (`ORGAN_INTENSITIES_FILENAME`) |
| Session / segmentation outputs | Derived NPZ/NIfTI and overlays per pipeline |

The **ScanPilot** GitHub Pages demo uses **pre-rendered PNG stacks** under `assets/demo-cases/<case>/ct/` and `overlay/` instead of live NIfTI/NPZ in the browser.

## 3. Segmentation classes (`PREDEFINED_LABELS` in `constants.py`)

Integer-coded label set in the Flask constants (0–27):

- `adrenal_gland_left`, `adrenal_gland_right`
- `aorta`, `bladder`, `celiac_artery`, `colon`, `common_bile_duct`, `duodenum`
- `femur_left`, `femur_right`, `gall_bladder`
- `kidney_left`, `kidney_right`, `liver`, `lung_left`, `lung_right`
- `pancreas_body`, `pancreas_head`, `pancreas_tail`, `pancreas`
- `pancreatic_duct`, `pancreatic_lesion`
- `postcava`, `prostate`, `spleen`, `stomach`, `superior_mesenteric_artery`, `veins`

The demo console collapses several classes into **aggregated overlay PNGs** (`pancreas_*`, `duct_*`, `lesion_*`, `nearby_*`) for static export clarity.

## 4. PanTS-Demo (Vite + React) frontend features

| Feature / surface            | Location / notes |
|-----------------------------|------------------|
| Case selection              | `VisualizationPage.tsx`, contexts, routes      |
| CT visualization            | Cornerstone / NiiVue helpers (`CornerstoneNifti*.tsx`, `NiiVueNifti.ts`) |
| Nested organ checkboxes     | `NestedCheckBox/` components                    |
| Opacity slider              | `OpacitySlider/`                              |
| Windowing slider            | `WindowingSlider/`                             |
| Zoom handling               | `zoomHandle.tsx`                               |
| Report screen               | `ReportScreen/`                                |
| Pagination                  | `pagination.tsx`                               |
| Loading state               | `Loading.tsx`                                  |
| 3D organ GLB assets         | `public/3d-*.glb` (colon, kidney, liver, lung, pancreas) |
| Upload page                 | `UploadPage.tsx`                               |
| Data page                   | `DataPage.tsx`                                 |
| Visualization page        | `VisualizationPage.tsx`                        |
| Home / about                | `Homepage.tsx`, `About.tsx`, `Header.tsx`     |

**ScanPilot-site** reimplements a **subset** of these ideas in plain HTML/CSS/JS for static hosting (sliders, layer toggles, window-style CSS filters, cine, stepper, panels).

## 5. Flask-server backend ideas

| Area                    | Files / notes |
|-------------------------|---------------|
| Application sessions    | `models/application_session.py`, `services/session_manager.py` |
| Combined label model    | `models/combined_labels.py` (paths + JSON metadata) |
| NIfTI processing        | `services/nifti_processor.py`, unit tests under `tests/unit/` |
| NPZ processing          | `services/npz_processor.py` |
| Auto segmentation       | `services/auto_segmentor.py` |
| Inference job queue     | `services/inference_job_queue.py` |
| Report / PDF pipeline     | `api/utils.py` (`generate_pdf_with_template`, ReportLab + PyPDF2 merge), `api/api_blueprint.py` route `get-report/<id>`, template env `TEMPLATE_PATH` / `report_template_3.pdf` |
| Worker scripts            | `scripts/epai_pull_worker.py`, `scripts/run_epai_worker.sh`, `smoke_test_pull_queue.sh` |
| Deploy hints              | `deploy/nginx-bodymaps.conf`, systemd unit examples |

None of this runs on **GitHub Pages**; the production demo stays static and only **mirrors** workflow language and API-shaped JSON in the UI.

## 6. GLB assets for optional static 3D preview

The repository vendors **`assets/models/3d-pancreas.glb`** only (~0.7MB) for the optional 3D panel. Additional organs (`3d-colon`, `3d-kidney`, `3d-liver`, `3d-lung`) remain in `PanTS-Viewer/PanTS-Demo/public/` — copy into `assets/models/` locally if you want to swap the preview asset.

The interactive demo loads **`<model-viewer>`** from Google’s CDN only when the user expands the optional 3D panel so the core page stays lightweight.
