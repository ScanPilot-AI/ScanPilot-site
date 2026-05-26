"""Shared helpers for PanTS Atlas asset pipeline."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image
from scipy.ndimage import zoom

REPO_ROOT = Path(__file__).resolve().parents[1]
PANTS_DATA = REPO_ROOT / "PanTS-Viewer" / "PanTS" / "data"
IMAGE_TR = PANTS_DATA / "ImageTr"
LABEL_TR = PANTS_DATA / "LabelTr"
ATLAS_ROOT = REPO_ROOT / "assets" / "pants-atlas"
CASES_ROOT = ATLAS_ROOT / "cases"
DATABASE_ROOT = ATLAS_ROOT / "database"

NUM_SLICES = 17
MAX_EDGE = 520
WINDOW_WIDTH = 400.0
WINDOW_CENTER = 40.0
SLICE_AXIS = 2

ORGAN_GROUPS: dict[str, list[str]] = {
    "pancreas": [
        "pancreas",
        "pancreas_head",
        "pancreas_body",
        "pancreas_tail",
    ],
    "duct_lesion": ["pancreatic_duct", "pancreatic_lesion"],
    "adjacent_gi": [
        "duodenum",
        "stomach",
        "colon",
        "gall_bladder",
        "common_bile_duct",
    ],
    "vascular": [
        "aorta",
        "celiac_artery",
        "superior_mesenteric_artery",
        "postcava",
        "veins",
    ],
    "renal_adrenal": [
        "kidney_left",
        "kidney_right",
        "adrenal_gland_left",
        "adrenal_gland_right",
        "bladder",
        "prostate",
    ],
}

ORGAN_COLORS: dict[str, tuple[int, int, int, int]] = {
    "pancreas": (52, 211, 153, 170),
    "pancreas_head": (16, 185, 129, 165),
    "pancreas_body": (45, 212, 191, 165),
    "pancreas_tail": (110, 231, 183, 165),
    "pancreatic_duct": (34, 211, 238, 200),
    "pancreatic_lesion": (251, 191, 36, 210),
    "liver": (167, 139, 250, 150),
    "spleen": (192, 132, 252, 150),
    "kidney_left": (96, 165, 250, 145),
    "kidney_right": (59, 130, 246, 145),
    "stomach": (244, 114, 182, 140),
    "duodenum": (251, 146, 60, 140),
    "colon": (217, 119, 6, 140),
    "aorta": (248, 113, 113, 175),
    "celiac_artery": (239, 68, 68, 175),
    "superior_mesenteric_artery": (220, 38, 38, 175),
    "postcava": (147, 197, 253, 160),
    "veins": (125, 211, 252, 160),
    "gall_bladder": (163, 230, 53, 140),
    "common_bile_duct": (132, 204, 22, 150),
    "lung_left": (148, 163, 184, 120),
    "lung_right": (100, 116, 139, 120),
    "adrenal_gland_left": (14, 165, 233, 140),
    "adrenal_gland_right": (2, 132, 199, 140),
    "bladder": (186, 230, 253, 130),
    "prostate": (125, 211, 252, 130),
    "femur_left": (203, 213, 225, 100),
    "femur_right": (203, 213, 225, 100),
}

DEFAULT_OVERLAY_COLOR = (56, 189, 248, 150)


def list_case_ids() -> list[str]:
    if not IMAGE_TR.is_dir():
        return []
    ids = sorted(
        p.name
        for p in IMAGE_TR.iterdir()
        if p.is_dir() and (p / "ct.npz").exists()
    )
    return ids


def list_segmentation_organs(case_id: str) -> list[str]:
    seg_dir = LABEL_TR / case_id / "segmentations"
    if not seg_dir.is_dir():
        return []
    return sorted(
        f.stem for f in seg_dir.glob("*.npz") if f.is_file()
    )


def load_volume_npz(path: Path) -> np.ndarray:
    data = np.load(path)
    key = "data" if "data" in data.files else data.files[0]
    return np.asanyarray(data[key])


def organ_group_for(organ: str) -> str:
    for group, organs in ORGAN_GROUPS.items():
        if organ in organs:
            return group
    return "other"


def window_image(vol2d: np.ndarray, ww: float = WINDOW_WIDTH, wc: float = WINDOW_CENTER) -> np.ndarray:
    lo = wc - ww / 2.0
    hi = wc + ww / 2.0
    y = np.clip(vol2d.astype(np.float32), lo, hi)
    y = (y - lo) / max(hi - lo, 1e-6)
    return (y * 255).astype(np.uint8)


def resize_gray(img: np.ndarray, target_max: int = MAX_EDGE) -> np.ndarray:
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
    h, w, _ = rgba.shape
    zfy, zfx = nh / h, nw / w
    out = np.zeros((nh, nw, 4), dtype=np.uint8)
    for c in range(4):
        out[:, :, c] = np.clip(
            zoom(rgba[:, :, c].astype(np.float32), (zfy, zfx), order=1), 0, 255
        ).astype(np.uint8)
    return out


def extract_slice_2d(vol: np.ndarray, axis: int, idx: int) -> np.ndarray:
    sl = np.take(vol, idx, axis=axis)
    return np.rot90(sl, k=1)


def mask_to_rgba(mask2d: np.ndarray, color: tuple[int, int, int, int]) -> np.ndarray:
    m = mask2d > 0
    rgba = np.zeros((*mask2d.shape, 4), dtype=np.uint8)
    rgba[m] = color
    return rgba


def pick_slice_indices(
    shape: tuple[int, ...],
    masks: dict[str, np.ndarray],
    n: int = NUM_SLICES,
    axis: int = SLICE_AXIS,
) -> list[int]:
    n_slices = shape[axis]
    scores = np.zeros(n_slices, dtype=np.float64)
    focus = (
        ORGAN_GROUPS["pancreas"]
        + ORGAN_GROUPS["duct_lesion"]
    )
    for organ in focus:
        if organ not in masks:
            continue
        m = masks[organ]
        for i in range(n_slices):
            sl = np.take(m, i, axis=axis)
            scores[i] += float(sl.sum())

    if scores.max() <= 0:
        mid = n_slices // 2
    else:
        mid = int(np.argmax(scores))

    half = n // 2
    start = max(0, mid - half)
    end = min(n_slices, start + n)
    start = max(0, end - n)
    return list(range(start, end))


def rel_repo_path(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
