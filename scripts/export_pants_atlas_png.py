#!/usr/bin/env python3
"""Export browser-ready PanTS Atlas PNG stacks from local PanTS npz volumes."""
from __future__ import annotations

import sys
from datetime import datetime, timezone

import numpy as np
from PIL import Image

from pants_atlas_common import (
    ATLAS_ROOT,
    CASES_ROOT,
    DEFAULT_OVERLAY_COLOR,
    IMAGE_TR,
    LABEL_TR,
    NUM_SLICES,
    ORGAN_COLORS,
    SLICE_AXIS,
    extract_slice_2d,
    list_case_ids,
    list_segmentation_organs,
    load_volume_npz,
    mask_to_rgba,
    pick_slice_indices,
    rel_repo_path,
    resize_gray,
    resize_rgba,
    window_image,
    write_json,
)


def export_case(case_id: str) -> dict:
    ct_path = IMAGE_TR / case_id / "ct.npz"
    seg_dir = LABEL_TR / case_id / "segmentations"
    out_dir = CASES_ROOT / case_id
    ct_out = out_dir / "ct"
    ct_out.mkdir(parents=True, exist_ok=True)

    vol = load_volume_npz(ct_path)
    organ_names = list_segmentation_organs(case_id)
    masks: dict[str, np.ndarray] = {}
    for organ in organ_names:
        arr = load_volume_npz(seg_dir / f"{organ}.npz")
        if arr.shape != vol.shape:
            raise RuntimeError(
                f"{case_id}/{organ}: mask shape {arr.shape} != ct {vol.shape}"
            )
        masks[organ] = arr

    source_indices = pick_slice_indices(vol.shape, masks)
    ct_frames: list[str] = []
    source_slice_ids: list[int] = []
    overlays: dict[str, list[str]] = {}
    overlay_dirs: dict[str, str] = {}

    for organ in organ_names:
        if int(masks[organ].sum()) == 0:
            continue
        # Skip organs with no voxels in the export slice window
        window_sum = sum(
            int(np.take(masks[organ], i, axis=SLICE_AXIS).sum()) for i in source_indices
        )
        if window_sum == 0:
            continue
        odir = out_dir / "overlays" / organ
        odir.mkdir(parents=True, exist_ok=True)
        overlay_dirs[organ] = rel_repo_path(odir)
        overlays[organ] = []

    for out_i, src_i in enumerate(source_indices):
        ct2d = extract_slice_2d(vol, SLICE_AXIS, src_i)
        ct_gray = window_image(ct2d)
        ct_gray = resize_gray(ct_gray)
        nh, nw = ct_gray.shape
        ct_name = f"{out_i:03d}.png"
        ct_path_out = ct_out / ct_name
        Image.fromarray(ct_gray, mode="L").save(ct_path_out)
        ct_frames.append(rel_repo_path(ct_path_out))
        source_slice_ids.append(int(src_i))

        for organ, mask_vol in masks.items():
            if organ not in overlays:
                continue
            m2d = extract_slice_2d(mask_vol, SLICE_AXIS, src_i)
            if not m2d.any():
                continue
            color = ORGAN_COLORS.get(organ, DEFAULT_OVERLAY_COLOR)
            rgba = mask_to_rgba(m2d, color)
            rgba = resize_rgba(rgba, nh, nw)
            oname = f"{out_i:03d}.png"
            opath = out_dir / "overlays" / organ / oname
            Image.fromarray(rgba, mode="RGBA").save(opath)
            overlays[organ].append(rel_repo_path(opath))

    # Pad overlay lists to match slice count with empty strings for missing frames
    for organ in list(overlays.keys()):
        padded: list[str] = []
        for out_i, src_i in enumerate(source_indices):
            expected = out_dir / "overlays" / organ / f"{out_i:03d}.png"
            if expected.exists():
                padded.append(rel_repo_path(expected))
            else:
                padded.append("")
        overlays[organ] = padded

    # Drop organs that never produced overlay PNGs in this window
    overlays = {
        organ: paths
        for organ, paths in overlays.items()
        if any(paths)
    }
    available_organs = sorted(overlays.keys())
    manifest = {
        "version": 1,
        "caseId": case_id,
        "sliceCount": len(source_indices),
        "ctFrames": ct_frames,
        "sourceSliceIds": source_slice_ids,
        "overlays": overlays,
        "availableOrgans": available_organs,
        "hasPancreaticDuct": "pancreatic_duct" in available_organs,
        "hasPancreaticLesion": "pancreatic_lesion" in available_organs,
        "thumbnailFrame": ct_frames[len(ct_frames) // 2] if ct_frames else None,
    }
    write_json(out_dir / "manifest.json", manifest)
    return manifest


def main() -> int:
    case_ids = list_case_ids()
    if not case_ids:
        print("No cases to export.", file=sys.stderr)
        return 1

    CASES_ROOT.mkdir(parents=True, exist_ok=True)
    summaries: list[dict] = []
    total_frames = 0
    total_overlay_stacks = 0
    all_organs: set[str] = set()

    for case_id in case_ids:
        print(f"Exporting {case_id} …")
        manifest = export_case(case_id)
        summaries.append(
            {
                "caseId": case_id,
                "manifestPath": rel_repo_path(CASES_ROOT / case_id / "manifest.json"),
                "sliceCount": manifest["sliceCount"],
                "organCount": len(manifest["availableOrgans"]),
                "hasPancreaticDuct": manifest["hasPancreaticDuct"],
                "hasPancreaticLesion": manifest["hasPancreaticLesion"],
                "thumbnailFrame": manifest.get("thumbnailFrame"),
            }
        )
        total_frames += manifest["sliceCount"]
        total_overlay_stacks += len(manifest["availableOrgans"])
        all_organs.update(manifest["availableOrgans"])

    global_manifest = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "disclaimer": (
            "Static demo using precomputed PanTS-derived assets. "
            "Not for clinical diagnosis."
        ),
        "caseCount": len(case_ids),
        "totalExportedCtFrames": total_frames,
        "totalOrganOverlayStacks": total_overlay_stacks,
        "uniqueOrganLayers": sorted(all_organs),
        "cases": summaries,
    }
    write_json(CASES_ROOT / "manifest.json", global_manifest)
    print(
        f"Done: {len(case_ids)} cases, {total_frames} CT frames, "
        f"{total_overlay_stacks} overlay stacks → {ATLAS_ROOT}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
