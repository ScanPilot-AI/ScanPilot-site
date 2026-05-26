#!/usr/bin/env python3
"""Scan PanTS source data and emit PanTS Atlas database JSON files."""
from __future__ import annotations

import sys
from datetime import datetime, timezone

from pants_atlas_common import (
    DATABASE_ROOT,
    IMAGE_TR,
    LABEL_TR,
    ORGAN_GROUPS,
    list_case_ids,
    list_segmentation_organs,
    organ_group_for,
    write_json,
)


def main() -> int:
    case_ids = list_case_ids()
    if not case_ids:
        print("No cases found under PanTS-Viewer/PanTS/data/ImageTr", file=sys.stderr)
        return 1

    all_organs: set[str] = set()
    cases_db: list[dict] = []
    case_index: list[dict] = []

    group_coverage: dict[str, set[str]] = {g: set() for g in list(ORGAN_GROUPS) + ["other"]}

    for case_id in case_ids:
        organs = list_segmentation_organs(case_id)
        all_organs.update(organs)

        has_lesion = "pancreatic_lesion" in organs
        has_duct = "pancreatic_duct" in organs
        has_pancreas = "pancreas" in organs

        groups_present = {organ_group_for(o) for o in organs}
        for g in groups_present:
            group_coverage[g].add(case_id)

        entry = {
            "caseId": case_id,
            "displayName": case_id.replace("PanTS_", "Case "),
            "ctSource": f"PanTS-Viewer/PanTS/data/ImageTr/{case_id}/ct.npz",
            "labelSource": f"PanTS-Viewer/PanTS/data/LabelTr/{case_id}",
            "organs": organs,
            "organCount": len(organs),
            "hasPancreas": has_pancreas,
            "hasPancreaticDuct": has_duct,
            "hasPancreaticLesion": has_lesion,
            "organGroups": sorted(groups_present),
        }
        cases_db.append(entry)
        case_index.append(
            {
                "caseId": case_id,
                "displayName": entry["displayName"],
                "organCount": len(organs),
                "hasPancreaticDuct": has_duct,
                "hasPancreaticLesion": has_lesion,
                "manifestPath": f"assets/pants-atlas/cases/{case_id}/manifest.json",
            }
        )

    organ_schema = []
    for organ in sorted(all_organs):
        organ_schema.append(
            {
                "id": organ,
                "label": organ.replace("_", " ").title(),
                "group": organ_group_for(organ),
            }
        )

    generated_at = datetime.now(timezone.utc).isoformat()

    database = {
        "version": 1,
        "generatedAt": generated_at,
        "sourceRoot": "PanTS-Viewer/PanTS/data",
        "caseCount": len(case_ids),
        "cases": cases_db,
        "uniqueOrgans": sorted(all_organs),
        "groupCoverage": {
            g: {
                "caseCount": len(ids),
                "caseIds": sorted(ids),
            }
            for g, ids in group_coverage.items()
        },
    }

    index = {
        "version": 1,
        "generatedAt": generated_at,
        "cases": case_index,
    }

    schema = {
        "version": 1,
        "generatedAt": generated_at,
        "groups": {
            "pancreas": "Pancreas",
            "duct_lesion": "Duct / Lesion",
            "adjacent_gi": "Adjacent GI",
            "vascular": "Vascular",
            "renal_adrenal": "Renal / Adrenal",
            "other": "Other anatomy",
        },
        "organs": organ_schema,
    }

    write_json(DATABASE_ROOT / "pantsAtlasDatabase.json", database)
    write_json(DATABASE_ROOT / "caseIndex.json", index)
    write_json(DATABASE_ROOT / "organSchema.json", schema)

    print(f"Wrote database for {len(case_ids)} cases, {len(all_organs)} unique organs.")
    print(f"  {DATABASE_ROOT / 'pantsAtlasDatabase.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
