#!/usr/bin/env python3
"""Export browser-ready PanTS Atlas PNG stacks from local PanTS npz volumes."""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image

from pants_atlas_common import (
    ATLAS_ROOT,
    CASES_ROOT,
    DATABASE_ROOT,
    DEFAULT_OVERLAY_COLOR,
    IMAGE_TR,
    LABEL_TR,
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
    ct_slice_names = [Path(p).name for p in ct_frames]
    overlay_slice_names = {
        organ: [Path(p).name if p else "" for p in paths]
        for organ, paths in overlays.items()
    }
    return {
        "version": 2,
        "caseId": case_id,
        "displayName": f"Case {case_id.replace('PanTS_', '')}",
        "sliceCount": len(source_indices),
        "ctFrames": ct_frames,
        "ctSliceNames": ct_slice_names,
        "sourceSliceIds": source_slice_ids,
        "overlaysByOrgan": overlays,
        "overlaySliceNames": overlay_slice_names,
        "availableOrgans": available_organs,
        "organs": available_organs,
        "organCount": len(available_organs),
        "hasPancreaticDuct": "pancreatic_duct" in available_organs,
        "hasPancreaticLesion": "pancreatic_lesion" in available_organs,
        "thumbnail": ct_frames[len(ct_frames) // 2] if ct_frames else None,
    }


def main() -> int:
    case_ids = list_case_ids()
    if not case_ids:
        print("No cases to export.", file=sys.stderr)
        return 1

    CASES_ROOT.mkdir(parents=True, exist_ok=True)
    db_cases: list[dict] = []
    index_cases: list[dict] = []
    total_frames = 0
    total_overlay_stacks = 0
    all_organs: set[str] = set()
    generated_at = datetime.now(timezone.utc).isoformat()

    for case_id in case_ids:
        print(f"Exporting {case_id} …")
        record = export_case(case_id)
        db_cases.append(record)
        index_cases.append(
            {
                "caseId": case_id,
                "displayName": record["displayName"],
                "sliceCount": record["sliceCount"],
                "organCount": record["organCount"],
                "hasPancreaticDuct": record["hasPancreaticDuct"],
                "hasPancreaticLesion": record["hasPancreaticLesion"],
                "thumbnail": record.get("thumbnail"),
            }
        )
        total_frames += record["sliceCount"]
        total_overlay_stacks += len(record["availableOrgans"])
        all_organs.update(record["availableOrgans"])

    DATABASE_ROOT.mkdir(parents=True, exist_ok=True)
    write_json(
        DATABASE_ROOT / "pantsAtlasDatabase.json",
        {
            "version": 2,
            "generatedAt": generated_at,
            "caseCount": len(db_cases),
            "cases": db_cases,
            "uniqueOrgans": sorted(all_organs),
        },
    )
    write_json(
        DATABASE_ROOT / "caseIndex.json",
        {"version": 2, "generatedAt": generated_at, "cases": index_cases},
    )
    print(
        f"Done: {len(case_ids)} cases, {total_frames} CT frames, "
        f"{total_overlay_stacks} overlay stacks → {ATLAS_ROOT}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
