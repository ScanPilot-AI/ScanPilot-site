#!/usr/bin/env python3
"""Verify PanTS Atlas exported assets against manifests."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from pants_atlas_common import ATLAS_ROOT, CASES_ROOT, REPO_ROOT


def main() -> int:
    global_path = CASES_ROOT / "manifest.json"
    if not global_path.exists():
        print("Missing global manifest. Run export_pants_atlas_png.py first.", file=sys.stderr)
        return 1

    global_manifest = json.loads(global_path.read_text(encoding="utf-8"))
    errors: list[str] = []
    warnings: list[str] = []
    cases_ok = 0
    total_frames = 0
    total_overlays = 0

    for summary in global_manifest.get("cases", []):
        case_id = summary["caseId"]
        manifest_path = REPO_ROOT / summary["manifestPath"]
        if not manifest_path.exists():
            errors.append(f"{case_id}: missing manifest {summary['manifestPath']}")
            continue

        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        ct_frames = manifest.get("ctFrames", [])
        if not ct_frames:
            errors.append(f"{case_id}: no CT frames in manifest")
        else:
            for rel in ct_frames:
                if not (REPO_ROOT / rel).is_file():
                    errors.append(f"{case_id}: missing CT frame {rel}")

        overlays = manifest.get("overlays", {})
        for organ, paths in overlays.items():
            existing = [p for p in paths if p]
            if not existing:
                warnings.append(f"{case_id}: organ {organ} has no overlay PNGs")
                continue
            for rel in existing:
                if not (REPO_ROOT / rel).is_file():
                    errors.append(f"{case_id}: missing overlay {rel}")

        for organ, paths in overlays.items():
            if not any(paths):
                errors.append(f"{case_id}: organ {organ} has empty overlay list")

        # Source npz may exist even when absent in the exported slice window — warn only
        seg_dir = REPO_ROOT / "PanTS-Viewer" / "PanTS" / "data" / "LabelTr" / case_id / "segmentations"
        for required in ("pancreas", "pancreatic_duct", "pancreatic_lesion"):
            src = seg_dir / f"{required}.npz"
            if src.is_file() and required not in manifest.get("availableOrgans", []):
                warnings.append(
                    f"{case_id}: {required} in source but not visible in exported slice window"
                )

        if "pancreatic_lesion" in manifest.get("availableOrgans", []):
            if not manifest.get("hasPancreaticLesion"):
                warnings.append(f"{case_id}: lesion organ present but flag false")

        cases_ok += 1
        total_frames += len(ct_frames)
        total_overlays += len(overlays)

    print("PanTS Atlas asset audit")
    print("=" * 40)
    print(f"Cases checked:     {cases_ok}")
    print(f"CT frames:         {total_frames}")
    print(f"Organ stacks:      {total_overlays}")
    print(f"Unique organs:     {len(global_manifest.get('uniqueOrganLayers', []))}")
    print(f"Errors:            {len(errors)}")
    print(f"Warnings:          {len(warnings)}")

    if warnings:
        print("\nWarnings:")
        for w in warnings[:20]:
            print(f"  - {w}")
        if len(warnings) > 20:
            print(f"  … and {len(warnings) - 20} more")

    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
