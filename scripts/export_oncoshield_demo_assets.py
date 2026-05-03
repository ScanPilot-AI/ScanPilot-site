#!/usr/bin/env python3
"""
Download public PanTS (iPanTSMini) volumes from HuggingFace and export
compressed axial PNGs + RGBA overlays for the static OncoShield /demo page.

Run from repo root (requires nibabel, numpy, pillow, scipy, requests):
  .venv/bin/python scripts/export_oncoshield_demo_assets.py

Does not modify PanTS-Viewer. Output: assets/demo-cases/ and assets/data/demoCases.json
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Iterable

import numpy as np
import nibabel as nib
import requests
from PIL import Image
from scipy.ndimage import zoom

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_CASES = REPO_ROOT / "assets" / "demo-cases"
OUT_JSON = REPO_ROOT / "assets" / "data" / "demoCases.json"

CASE_IDS = [
    "PanTS_00000001",
    "PanTS_00000017",
    "PanTS_00000030",
    "PanTS_00000035",
    "PanTS_00000121",
]

HF_IMAGE = "https://huggingface.co/datasets/BodyMaps/iPanTSMini/resolve/main/image_only/{case_id}/ct.nii.gz?download=true"
HF_MASK = "https://huggingface.co/datasets/BodyMaps/iPanTSMini/resolve/main/mask_only/{case_id}/combined_labels.nii.gz?download=true"

# nnUNet-style combined label ids (1..28) matching PanTS-Demo segmentation_categories order
LABEL_PANCREAS = {17, 18, 19, 20}  # whole + body + head + tail
LABEL_DUCT = {21}
LABEL_LESION = {22}
LABEL_NEARBY = {8, 12, 13, 14, 25, 26}  # duodenum, kidneys, liver, spleen, stomach

MAX_EDGE = 520
NUM_SLICES = 9  # odd count centered on pancreas-heavy slice
WINDOW_WIDTH = 400.0
WINDOW_CENTER = 40.0


def download(url: str) -> bytes:
    r = requests.get(url, timeout=120)
    r.raise_for_status()
    return r.content


def window_image(vol2d: np.ndarray, ww: float, wc: float) -> np.ndarray:
    lo = wc - ww / 2.0
    hi = wc + ww / 2.0
    y = np.clip(vol2d, lo, hi)
    y = (y - lo) / max(hi - lo, 1e-6)
    return (y * 255).astype(np.uint8)


def resize_gray(img: np.ndarray, target_max: int) -> np.ndarray:
    h, w = img.shape
    m = max(h, w)
    if m <= target_max:
        return img
    scale = target_max / m
    nh, nw = int(round(h * scale)), int(round(w * scale))
    zf = nh / h
    arr = zoom(img.astype(np.float32), zf, order=1)
    return np.clip(arr, 0, 255).astype(np.uint8)


def resize_rgba(rgba: np.ndarray, nh: int, nw: int) -> np.ndarray:
    """rgba HxWx4"""
    h, w, _ = rgba.shape
    zfy, zfx = nh / h, nw / w
    out = np.zeros((nh, nw, 4), dtype=np.uint8)
    for c in range(4):
        out[:, :, c] = np.clip(
            zoom(rgba[:, :, c].astype(np.float32), (zfy, zfx), order=1), 0, 255
        ).astype(np.uint8)
    return out


def mask_overlay(
    lab2d: np.ndarray, labels: Iterable[int], color: tuple[int, int, int, int]
) -> np.ndarray:
    m = np.isin(np.rint(lab2d).astype(np.int32), list(labels))
    rgba = np.zeros((*lab2d.shape, 4), dtype=np.uint8)
    rgba[m] = color
    return rgba


def best_axis_and_slice(labels: np.ndarray) -> tuple[int, int]:
    best = (0, 0, 0)  # axis, idx, count
    targets = LABEL_PANCREAS | LABEL_DUCT | LABEL_LESION
    for axis in range(3):
        n = labels.shape[axis]
        for i in range(n):
            sl = np.take(labels, i, axis=axis)
            c = int(np.isin(np.rint(sl).astype(np.int32), list(targets)).sum())
            if c > best[2]:
                best = (axis, i, c)
    return best[0], best[1]


def extract_slice(vol: np.ndarray, lab: np.ndarray, axis: int, idx: int) -> tuple[np.ndarray, np.ndarray]:
    v = np.take(vol, idx, axis=axis)
    l = np.take(lab, idx, axis=axis)
    # rotate so display is row-major upright (simple flip for common RAS axial)
    v = np.rot90(v, k=1)
    l = np.rot90(l, k=1)
    return v, l


def process_case(case_id: str) -> dict:
    print(f"Processing {case_id} …")
    ct_url = HF_IMAGE.format(case_id=case_id)
    mk_url = HF_MASK.format(case_id=case_id)

    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        ct_path = td / "ct.nii.gz"
        mk_path = td / "mask.nii.gz"
        ct_path.write_bytes(download(ct_url))
        mk_path.write_bytes(download(mk_url))

        ct_img = nib.load(str(ct_path))
        mk_img = nib.load(str(mk_path))
        vol = np.asanyarray(ct_img.dataobj).astype(np.float32)
        lab = np.asanyarray(mk_img.dataobj).astype(np.float32)

        if vol.shape != lab.shape:
            raise RuntimeError(f"Shape mismatch {case_id}: ct {vol.shape} vs lab {lab.shape}")

        axis, mid = best_axis_and_slice(lab)
        half = NUM_SLICES // 2
        indices = range(max(0, mid - half), min(vol.shape[axis], mid + half + 1))
        indices = list(indices)[:NUM_SLICES]
        if len(indices) < NUM_SLICES:
            # pad toward upper bound if hit lower bound
            lo = indices[0]
            hi = indices[-1]
            while len(indices) < NUM_SLICES and hi + 1 < vol.shape[axis]:
                hi += 1
                indices.append(hi)
            while len(indices) < NUM_SLICES and lo - 1 >= 0:
                lo -= 1
                indices.insert(0, lo)

        case_dir = OUT_CASES / case_id
        (case_dir / "ct").mkdir(parents=True, exist_ok=True)
        (case_dir / "overlay").mkdir(parents=True, exist_ok=True)

        rel_ct: list[str] = []
        rel_p: list[str] = []
        rel_d: list[str] = []
        rel_l: list[str] = []
        rel_n: list[str] = []

        for j, idx in enumerate(indices):
            v2, l2 = extract_slice(vol, lab, axis, idx)
            g = window_image(v2, WINDOW_WIDTH, WINDOW_CENTER)
            g = resize_gray(g, MAX_EDGE)
            h, w = g.shape

            p_rgba = resize_rgba(mask_overlay(l2, LABEL_PANCREAS, (110, 220, 255, 140)), h, w)
            d_rgba = resize_rgba(mask_overlay(l2, LABEL_DUCT, (255, 214, 120, 160)), h, w)
            le_rgba = resize_rgba(mask_overlay(l2, LABEL_LESION, (255, 95, 120, 170)), h, w)
            n_rgba = resize_rgba(mask_overlay(l2, LABEL_NEARBY, (140, 190, 255, 90)), h, w)

            si = f"{j:02d}"
            Image.fromarray(g, mode="L").save(
                case_dir / "ct" / f"{si}.png", optimize=True, compress_level=9
            )
            Image.fromarray(p_rgba, mode="RGBA").save(
                case_dir / "overlay" / f"pancreas_{si}.png", optimize=True, compress_level=9
            )
            Image.fromarray(d_rgba, mode="RGBA").save(
                case_dir / "overlay" / f"duct_{si}.png", optimize=True, compress_level=9
            )
            Image.fromarray(le_rgba, mode="RGBA").save(
                case_dir / "overlay" / f"lesion_{si}.png", optimize=True, compress_level=9
            )
            Image.fromarray(n_rgba, mode="RGBA").save(
                case_dir / "overlay" / f"nearby_{si}.png", optimize=True, compress_level=9
            )

            rel_ct.append(f"demo-cases/{case_id}/ct/{si}.png")
            rel_p.append(f"demo-cases/{case_id}/overlay/pancreas_{si}.png")
            rel_d.append(f"demo-cases/{case_id}/overlay/duct_{si}.png")
            rel_l.append(f"demo-cases/{case_id}/overlay/lesion_{si}.png")
            rel_n.append(f"demo-cases/{case_id}/overlay/nearby_{si}.png")

        return {
            "caseId": case_id,
            "dataSource": "Public PanTS subset (iPanTSMini on HuggingFace). De-identified research sample.",
            "sliceCount": len(indices),
            "ctSlices": rel_ct,
            "overlays": {
                "pancreas": rel_p,
                "duct": rel_d,
                "lesion": rel_l,
                "nearby": rel_n,
            },
        }


def demo_metadata(case_id: str, base: dict) -> dict:
    """Conservative demo-only narrative fields (not model inference output)."""
    scores = {
        "PanTS_00000001": 0.41,
        "PanTS_00000017": 0.62,
        "PanTS_00000030": 0.55,
        "PanTS_00000035": 0.71,
        "PanTS_00000121": 0.48,
    }
    score = scores.get(case_id, 0.5)
    level = "Moderate" if score < 0.65 else "Elevated"
    return {
        **base,
        "findingSummary": "Anatomy-aware parse complete. Candidate region flagged for human review.",
        "pdacSuspicionScore": score,
        "pdacSuspicionLabel": level,
        "anatomyStatus": "Parsed",
        "suspiciousRegionStatus": "Localized (demo visualization)",
        "reviewQueueStatus": "Queued for radiologist second-read (workflow simulation)",
        "findings": [
            "Pancreas localized on axial series",
            "Pancreatic duct / peri-pancreatic region reviewed",
            "Candidate lesion overlay available where label present",
            "Case queued for radiologist review in demo workflow",
        ],
        "recommendedWorkflow": [
            "Radiologist second-read on primary study",
            "Compare with prior CT if available",
            "Consider pancreas-protocol CT, MRI/MRCP, or EUS per clinical context",
        ],
    }


def main() -> None:
    OUT_CASES.mkdir(parents=True, exist_ok=True)
    (OUT_JSON.parent).mkdir(parents=True, exist_ok=True)

    cases_out: list[dict] = []
    for cid in CASE_IDS:
        meta = demo_metadata(cid, process_case(cid))
        cases_out.append(meta)

    payload = {
        "version": 1,
        "disclaimer": "Research and product demonstration only. Not for diagnosis, treatment, or patient-care decisions. Not FDA cleared.",
        "cases": cases_out,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_JSON}")


if __name__ == "__main__":
    main()
