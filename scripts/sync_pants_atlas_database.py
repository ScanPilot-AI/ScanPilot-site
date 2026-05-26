#!/usr/bin/env python3
"""Sync assets/pants-atlas/database/*.json from exported PNG stacks (no per-case manifest.json)."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from pants_atlas_common import (
    DATABASE_ROOT,
    ORGAN_GROUPS,
    REPO_ROOT,
    list_case_ids,
    rel_repo_path,
    write_json,
)

LOCAL_ATLAS_PATH = REPO_ROOT / "assets" / "data" / "pantsLocalAtlas.json"
CASES_ROOT = REPO_ROOT / "assets" / "pants-atlas" / "cases"


def organ_schema() -> dict:
    organs = []
    for group_id, ids in ORGAN_GROUPS.items():
        for oid in ids:
            organs.append(
                {
                    "id": oid,
                    "label": oid.replace("_", " ").title(),
                    "group": group_id,
                }
            )
    extra = [
        "femur_left",
        "femur_right",
        "lung_left",
        "lung_right",
    ]
    for oid in extra:
        if not any(o["id"] == oid for o in organs):
            g = "other"
            organs.append(
                {"id": oid, "label": oid.replace("_", " ").title(), "group": g}
            )
    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "groups": {
            "pancreas": "Pancreas",
            "duct_lesion": "Duct / Lesion",
            "adjacent_gi": "Adjacent GI",
            "vascular": "Vascular",
            "renal_adrenal": "Renal / Adrenal",
            "other": "Other anatomy",
        },
        "organs": sorted(organs, key=lambda x: x["id"]),
    }


def slice_name_from_path(path: str) -> str:
    return Path(path).name


def build_from_local_atlas() -> tuple[dict, dict]:
    if not LOCAL_ATLAS_PATH.is_file():
        raise SystemExit(f"Missing {LOCAL_ATLAS_PATH} — run build_pants_atlas_database.py first")

    local = json.loads(LOCAL_ATLAS_PATH.read_text(encoding="utf-8"))
    generated_at = datetime.now(timezone.utc).isoformat()
    db_cases: list[dict] = []
    index_cases: list[dict] = []
    all_organs: set[str] = set()

    for entry in local.get("cases", []):
        case_id = entry["caseId"]
        ct_frames = entry.get("ctPngFrames", [])
        overlays = entry.get("overlaysByOrgan", {})
        available = entry.get("availableOrgans", sorted(overlays.keys()))
        all_organs.update(available)

        ct_slice_names = [slice_name_from_path(p) for p in ct_frames]
        overlay_slices: dict[str, list[str]] = {}
        for organ, paths in overlays.items():
            overlay_slices[organ] = [slice_name_from_path(p) if p else "" for p in paths]

        record = {
            "caseId": case_id,
            "displayName": f"Case {case_id.replace('PanTS_', '')}",
            "sliceCount": entry.get("localFrameCount", len(ct_frames)),
            "ctFrames": ct_frames,
            "ctSliceNames": ct_slice_names,
            "sourceSliceIds": entry.get("sourceSliceIds", []),
            "overlaysByOrgan": overlays,
            "overlaySliceNames": overlay_slices,
            "availableOrgans": available,
            "organs": available,
            "organCount": len(available),
            "hasPancreas": any(o.startswith("pancreas") for o in available),
            "hasPancreaticDuct": entry.get("hasPancreaticDuct", False),
            "hasPancreaticLesion": entry.get("hasPancreaticLesion", False),
            "thumbnail": entry.get("thumbnail"),
            "organGroups": sorted(
                {g for oid in available for g, ids in ORGAN_GROUPS.items() if oid in ids}
                | {"other"}
            ),
        }
        db_cases.append(record)
        index_cases.append(
            {
                "caseId": case_id,
                "displayName": record["displayName"],
                "sliceCount": record["sliceCount"],
                "organCount": record["organCount"],
                "hasPancreaticDuct": record["hasPancreaticDuct"],
                "hasPancreaticLesion": record["hasPancreaticLesion"],
                "thumbnail": record["thumbnail"],
            }
        )

    database = {
        "version": 2,
        "generatedAt": generated_at,
        "caseCount": len(db_cases),
        "cases": db_cases,
        "uniqueOrgans": sorted(all_organs),
    }
    case_index = {
        "version": 2,
        "generatedAt": generated_at,
        "cases": index_cases,
    }
    return database, case_index


def build_from_filesystem(case_ids: list[str]) -> tuple[dict, dict]:
    """Fallback: scan ct/ and overlays/ when pantsLocalAtlas.json is unavailable."""
    generated_at = datetime.now(timezone.utc).isoformat()
    db_cases: list[dict] = []
    index_cases: list[dict] = []
    all_organs: set[str] = set()

    for case_id in case_ids:
        case_dir = CASES_ROOT / case_id
        ct_dir = case_dir / "ct"
        if not ct_dir.is_dir():
            continue
        ct_files = sorted(ct_dir.glob("*.png"))
        ct_frames = [rel_repo_path(p) for p in ct_files]
        ct_slice_names = [p.name for p in ct_files]
        overlays_dir = case_dir / "overlays"
        overlays: dict[str, list[str]] = {}
        overlay_slices: dict[str, list[str]] = {}
        if overlays_dir.is_dir():
            for organ_dir in sorted(overlays_dir.iterdir()):
                if not organ_dir.is_dir():
                    continue
                organ = organ_dir.name
                paths = []
                names = []
                for i, ct_name in enumerate(ct_slice_names):
                    op = organ_dir / ct_name
                    if op.is_file():
                        paths.append(rel_repo_path(op))
                        names.append(ct_name)
                    else:
                        paths.append("")
                        names.append("")
                if any(paths):
                    overlays[organ] = paths
                    overlay_slices[organ] = names
                    all_organs.add(organ)

        available = sorted(overlays.keys())
        record = {
            "caseId": case_id,
            "displayName": f"Case {case_id.replace('PanTS_', '')}",
            "sliceCount": len(ct_frames),
            "ctFrames": ct_frames,
            "ctSliceNames": ct_slice_names,
            "sourceSliceIds": [],
            "overlaysByOrgan": overlays,
            "overlaySliceNames": overlay_slices,
            "availableOrgans": available,
            "organs": available,
            "organCount": len(available),
            "hasPancreas": any(o.startswith("pancreas") for o in available),
            "hasPancreaticDuct": "pancreatic_duct" in available,
            "hasPancreaticLesion": "pancreatic_lesion" in available,
            "thumbnail": ct_frames[len(ct_frames) // 2] if ct_frames else None,
            "organGroups": [],
        }
        db_cases.append(record)
        index_cases.append(
            {
                "caseId": case_id,
                "displayName": record["displayName"],
                "sliceCount": record["sliceCount"],
                "organCount": record["organCount"],
                "hasPancreaticDuct": record["hasPancreaticDuct"],
                "hasPancreaticLesion": record["hasPancreaticLesion"],
                "thumbnail": record["thumbnail"],
            }
        )

    database = {
        "version": 2,
        "generatedAt": generated_at,
        "caseCount": len(db_cases),
        "cases": db_cases,
        "uniqueOrgans": sorted(all_organs),
    }
    case_index = {"version": 2, "generatedAt": generated_at, "cases": index_cases}
    return database, case_index


def main() -> int:
    DATABASE_ROOT.mkdir(parents=True, exist_ok=True)
    case_ids = list_case_ids()

    if LOCAL_ATLAS_PATH.is_file():
        database, case_index = build_from_local_atlas()
    else:
        database, case_index = build_from_filesystem(case_ids)

    schema = organ_schema()
    write_json(DATABASE_ROOT / "pantsAtlasDatabase.json", database)
    write_json(DATABASE_ROOT / "caseIndex.json", case_index)
    write_json(DATABASE_ROOT / "organSchema.json", schema)

    print(f"Wrote {DATABASE_ROOT / 'pantsAtlasDatabase.json'} ({database['caseCount']} cases)")
    print(f"Wrote {DATABASE_ROOT / 'caseIndex.json'}")
    print(f"Wrote {DATABASE_ROOT / 'organSchema.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
