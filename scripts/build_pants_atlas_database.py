#!/usr/bin/env python3
"""Build two-tier PanTS Atlas JSON: full metadata catalog + local volume atlas."""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from pants_atlas_common import (
    CASES_ROOT,
    IMAGE_TR,
    LABEL_TR,
    REPO_ROOT,
    list_case_ids,
    write_json,
)

DATA_OUT = REPO_ROOT / "assets" / "data"
METADATA_XLSX = REPO_ROOT / "PanTS-Viewer" / "PanTS" / "data" / "metadata.xlsx"

COLUMN_MAP = {
    "PanTS ID": "caseId",
    "shape": "shape",
    "spacing": "spacing",
    "ct phase": "ctPhase",
    "sex": "sex",
    "age": "age",
    "manufacturer": "manufacturer",
    "manufacturer model": "manufacturerModel",
    "study type": "studyType",
    "site": "site",
    "site detail": "siteDetail",
    "site nationality": "siteNationality",
    "study year": "studyYear",
    "tumor?": "tumor",
}

AGE_BUCKET_ORDER = ["<20", "20s", "30s", "40s", "50s", "60s", "70s", "80+"]
UNKNOWN_TOKENS = frozenset({"", "nan", "none", "null", "na", "n/a"})


def json_value(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, float) and pd.isna(val):
        return None
    if hasattr(val, "item"):
        try:
            if pd.isna(val):
                return None
        except (TypeError, ValueError):
            pass
        return val.item()
    if isinstance(val, (int, float, str, bool)):
        return val
    return str(val)


def normalize_cat(val: Any) -> str:
    if val is None:
        return "Unknown"
    if isinstance(val, float) and pd.isna(val):
        return "Unknown"
    s = str(val).strip()
    if not s or s.lower() in UNKNOWN_TOKENS:
        return "Unknown"
    return s


def normalize_sex(val: Any) -> str:
    s = normalize_cat(val)
    if s == "Unknown":
        return "Unknown"
    upper = s.upper()
    if upper in ("M", "MALE"):
        return "M"
    if upper in ("F", "FEMALE"):
        return "F"
    return s


def normalize_ct_phase(val: Any) -> str:
    return normalize_cat(val)


def normalize_manufacturer(val: Any) -> str:
    return normalize_cat(val)


def parse_nationality_tokens(val: Any) -> list[str]:
    s = normalize_cat(val)
    if s == "Unknown":
        return ["Unknown"]
    parts = re.split(r"[;,]", s)
    tokens = [normalize_cat(p) for p in parts]
    tokens = [t for t in tokens if t != "Unknown"]
    return tokens if tokens else ["Unknown"]


def parse_study_years(val: Any) -> list[int]:
    if val is None:
        return []
    if isinstance(val, float) and pd.isna(val):
        return []
    text = str(val)
    years: list[int] = []
    for match in re.finditer(r"\b(19|20)\d{2}\b", text):
        y = int(match.group(0))
        if 1900 <= y <= 2100:
            years.append(y)
    return years


def age_bucket(age: Any) -> str | None:
    if age is None:
        return None
    try:
        a = int(float(age))
    except (TypeError, ValueError):
        return None
    if a < 20:
        return "<20"
    if a < 30:
        return "20s"
    if a < 40:
        return "30s"
    if a < 50:
        return "40s"
    if a < 60:
        return "50s"
    if a < 70:
        return "60s"
    if a < 80:
        return "70s"
    return "80+"


def decade_label(year: int) -> str:
    d = (year // 10) * 10
    return f"{d}s"


def has_local_volume(case_id: str) -> bool:
    d = IMAGE_TR / case_id
    return (d / "ct.nii.gz").is_file() or (d / "ct.npz").is_file()


def has_local_labels(case_id: str) -> bool:
    seg = LABEL_TR / case_id / "segmentations"
    return seg.is_dir() and any(seg.glob("*.npz"))


def load_case_manifest(case_id: str) -> dict | None:
    path = CASES_ROOT / case_id / "manifest.json"
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def build_local_atlas_entry(case_id: str, catalog_row: dict) -> dict:
    manifest = load_case_manifest(case_id)
    if not manifest:
        raise FileNotFoundError(
            f"Missing exported manifest for {case_id}. Run export_pants_atlas_png.py"
        )

    overlays_by_organ: dict[str, list[str]] = {}
    for organ, paths in manifest.get("overlays", {}).items():
        overlays_by_organ[organ] = [p for p in paths if p]

    thumbnail = manifest.get("thumbnailFrame")
    if not thumbnail and manifest.get("ctFrames"):
        mid = len(manifest["ctFrames"]) // 2
        thumbnail = manifest["ctFrames"][mid]

    metadata = {
        k: catalog_row.get(k)
        for k in (
            "shape",
            "spacing",
            "ctPhase",
            "sex",
            "age",
            "manufacturer",
            "manufacturerModel",
            "studyType",
            "site",
            "siteDetail",
            "siteNationality",
            "studyYear",
            "tumor",
        )
    }

    return {
        "caseId": case_id,
        "ctPngFrames": manifest.get("ctFrames", []),
        "thumbnail": thumbnail,
        "overlaysByOrgan": overlays_by_organ,
        "availableOrgans": manifest.get("availableOrgans", []),
        "localFrameCount": manifest.get("sliceCount", len(manifest.get("ctFrames", []))),
        "sourceSliceIds": manifest.get("sourceSliceIds", []),
        "hasPancreaticDuct": manifest.get("hasPancreaticDuct", False),
        "hasPancreaticLesion": manifest.get("hasPancreaticLesion", False),
        "metadata": metadata,
    }


def build_summary(catalog_cases: list[dict], local_ids: set[str], unique_from_export: list[str]) -> dict:
    total = len(catalog_cases)

    sex_counts: Counter[str] = Counter()
    age_bucket_counts: Counter[str] = Counter()
    ct_phase_counts: Counter[str] = Counter()
    manufacturer_counts: Counter[str] = Counter()
    manufacturer_model_counts: Counter[str] = Counter()
    study_type_counts: Counter[str] = Counter()
    site_counts: Counter[str] = Counter()
    site_detail_counts: Counter[str] = Counter()
    nationality_token_counts: Counter[str] = Counter()
    study_year_counts: Counter[int] = Counter()
    study_decade_counts: Counter[str] = Counter()

    tumor_by_age: Counter[str] = Counter()
    tumor_by_sex: Counter[str] = Counter()
    tumor_by_phase: Counter[str] = Counter()
    tumor_by_nat: Counter[str] = Counter()
    age_bucket_denominators: Counter[str] = Counter()

    tumor_positive = 0
    tumor_negative = 0
    tumor_unknown = 0

    for c in catalog_cases:
        sex = normalize_sex(c.get("sex"))
        sex_counts[sex] += 1

        phase = normalize_ct_phase(c.get("ctPhase"))
        ct_phase_counts[phase] += 1

        mfr = normalize_manufacturer(c.get("manufacturer"))
        manufacturer_counts[mfr] += 1

        mm = normalize_cat(c.get("manufacturerModel"))
        manufacturer_model_counts[mm] += 1

        st = normalize_cat(c.get("studyType"))
        study_type_counts[st] += 1

        site = normalize_cat(c.get("site"))
        site_counts[site] += 1

        sd = normalize_cat(c.get("siteDetail"))
        site_detail_counts[sd] += 1

        nat_tokens = parse_nationality_tokens(c.get("siteNationality"))
        for tok in nat_tokens:
            nationality_token_counts[tok] += 1

        bucket = age_bucket(c.get("age"))
        if bucket:
            age_bucket_counts[bucket] += 1
            age_bucket_denominators[bucket] += 1

        years = parse_study_years(c.get("studyYear"))
        for y in years:
            study_year_counts[y] += 1
            study_decade_counts[decade_label(y)] += 1

        tumor = c.get("tumor")
        if tumor is True:
            tumor_positive += 1
            if bucket:
                tumor_by_age[bucket] += 1
            tumor_by_sex[sex] += 1
            tumor_by_phase[phase] += 1
            for tok in nat_tokens:
                tumor_by_nat[tok] += 1
        elif tumor is False:
            tumor_negative += 1
        else:
            tumor_unknown += 1

    local_volume = sum(1 for c in catalog_cases if c.get("hasLocalVolume"))
    local_full = sum(
        1 for c in catalog_cases if c.get("availabilityStatus") == "full_volume_segmentation"
    )

    years_list = list(study_year_counts.keys())
    study_year_range = (
        {"min": min(years_list), "max": max(years_list)} if years_list else {"min": None, "max": None}
    )

    age_bucket_ordered = {b: age_bucket_counts.get(b, 0) for b in AGE_BUCKET_ORDER}

    tumor_rate_by_age: dict[str, dict[str, float | int]] = {}
    for b in AGE_BUCKET_ORDER:
        denom = age_bucket_denominators.get(b, 0)
        num = tumor_by_age.get(b, 0)
        tumor_rate_by_age[b] = {
            "tumorPositive": num,
            "total": denom,
            "rate": round(num / denom * 100, 1) if denom else 0.0,
        }

    local_case_metadata = [
        {
            "caseId": c["caseId"],
            "sex": c.get("sex"),
            "age": c.get("age"),
            "tumor": c.get("tumor"),
            "ctPhase": c.get("ctPhase"),
            "siteNationality": c.get("siteNationality"),
        }
        for c in catalog_cases
        if c["caseId"] in local_ids
    ]

    return {
        "version": 3,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "disclosure": (
            "De-identified PanTS metadata catalog. Research-use static demo only. "
            "Not for clinical diagnosis. Not FDA cleared."
        ),
        "totalCatalogCases": total,
        "tumorPositiveCases": tumor_positive,
        "tumorNegativeCases": tumor_negative,
        "tumorUnknownCases": tumor_unknown,
        "tumorPositiveRate": round(tumor_positive / total * 100, 1) if total else 0,
        "localVolumeCases": local_volume,
        "localFullSegmentationCases": local_full,
        "metadataOnlyCases": total - local_volume,
        "sexCounts": dict(sex_counts),
        "ageBucketCounts": age_bucket_ordered,
        "ctPhaseCounts": dict(ct_phase_counts),
        "manufacturerCounts": dict(manufacturer_counts),
        "manufacturerModelCounts": dict(manufacturer_model_counts),
        "studyTypeCounts": dict(study_type_counts),
        "siteCounts": dict(site_counts),
        "siteDetailCounts": dict(site_detail_counts),
        "siteNationalityCounts": dict(
            sorted(nationality_token_counts.items(), key=lambda x: (-x[1], x[0]))
        ),
        "studyYearRange": study_year_range,
        "studyYearCounts": {str(k): v for k, v in sorted(study_year_counts.items())},
        "studyDecadeCounts": dict(
            sorted(study_decade_counts.items(), key=lambda x: x[0])
        ),
        "tumorByAgeBucket": {b: tumor_by_age.get(b, 0) for b in AGE_BUCKET_ORDER},
        "tumorRateByAgeBucket": tumor_rate_by_age,
        "tumorBySex": dict(tumor_by_sex),
        "tumorByCtPhase": dict(tumor_by_phase),
        "tumorBySiteNationality": dict(
            sorted(tumor_by_nat.items(), key=lambda x: (-x[1], x[0]))[:20]
        ),
        "organLayerCount": 28,
        "exportedOverlayLayerCount": len(unique_from_export),
        "canonicalOrganLabelCount": 28,
        "exportedOrganLayerCount": len(unique_from_export),
        "uniqueOrganLayers": unique_from_export,
        "localCaseIds": sorted(local_ids),
        "localCaseMetadata": local_case_metadata,
        # Legacy aliases
        "tumorCases": tumor_positive,
        "noTumorCases": tumor_negative,
    }


def main() -> int:
    if not METADATA_XLSX.is_file():
        print(f"Missing metadata: {METADATA_XLSX}", file=sys.stderr)
        return 1

    df = pd.read_excel(METADATA_XLSX)
    if len(df) != 9901:
        print(f"Warning: expected 9901 catalog rows, got {len(df)}", file=sys.stderr)

    local_ids = set(list_case_ids())
    generated_at = datetime.now(timezone.utc).isoformat()

    catalog_cases: list[dict] = []
    catalog_by_id: dict[str, dict] = {}

    for _, row in df.iterrows():
        entry: dict[str, Any] = {}
        for src_col, dst_key in COLUMN_MAP.items():
            raw = row.get(src_col)
            if dst_key == "tumor":
                if raw is None or (isinstance(raw, float) and pd.isna(raw)):
                    entry["tumor"] = None
                else:
                    entry["tumor"] = bool(int(raw))
            elif dst_key == "caseId":
                entry["caseId"] = str(raw).strip() if raw is not None else None
            else:
                entry[dst_key] = json_value(raw)

        case_id = entry["caseId"]
        if not case_id:
            continue

        entry["hasLocalVolume"] = has_local_volume(case_id)
        entry["hasLocalLabels"] = has_local_labels(case_id)
        if entry["hasLocalVolume"] and entry["hasLocalLabels"]:
            entry["availabilityStatus"] = "full_volume_segmentation"
        elif entry["hasLocalVolume"]:
            entry["availabilityStatus"] = "local_volume_only"
        else:
            entry["availabilityStatus"] = "metadata_only"
        entry["hasFullSegmentation"] = entry["availabilityStatus"] == "full_volume_segmentation"

        # Normalize categorical fields for catalog + summary consistency
        entry["sex"] = normalize_sex(entry.get("sex"))
        if entry["sex"] == "Unknown":
            entry["sex"] = None
        entry["ctPhase"] = normalize_ct_phase(entry.get("ctPhase"))
        if entry["ctPhase"] == "Unknown":
            entry["ctPhase"] = None
        entry["manufacturer"] = normalize_manufacturer(entry.get("manufacturer"))
        if entry["manufacturer"] == "Unknown":
            entry["manufacturer"] = None
        entry["manufacturerModel"] = normalize_cat(entry.get("manufacturerModel"))
        if entry["manufacturerModel"] == "Unknown":
            entry["manufacturerModel"] = None
        entry["studyType"] = normalize_cat(entry.get("studyType"))
        if entry["studyType"] == "Unknown":
            entry["studyType"] = None
        entry["site"] = normalize_cat(entry.get("site"))
        if entry["site"] == "Unknown":
            entry["site"] = None
        entry["siteDetail"] = normalize_cat(entry.get("siteDetail"))
        if entry["siteDetail"] == "Unknown":
            entry["siteDetail"] = None
        nat_tokens = parse_nationality_tokens(entry.get("siteNationality"))
        entry["siteNationality"] = (
            nat_tokens[0]
            if len(nat_tokens) == 1 and nat_tokens[0] != "Unknown"
            else (entry.get("siteNationality") if nat_tokens != ["Unknown"] else None)
        )

        catalog_cases.append(entry)
        catalog_by_id[case_id] = entry

    catalog_doc = {
        "version": 3,
        "generatedAt": generated_at,
        "totalCases": len(catalog_cases),
        "cases": catalog_cases,
    }
    write_json(DATA_OUT / "pantsCatalog.json", catalog_doc)

    local_cases: list[dict] = []
    unique_organs: set[str] = set()
    exported_ct_frames = 0
    exported_overlay_stacks = 0

    for case_id in sorted(local_ids):
        if case_id not in catalog_by_id:
            catalog_row = {"caseId": case_id, "tumor": None}
        else:
            catalog_row = catalog_by_id[case_id]

        try:
            local_entry = build_local_atlas_entry(case_id, catalog_row)
        except FileNotFoundError as exc:
            print(exc, file=sys.stderr)
            return 1

        local_cases.append(local_entry)
        unique_organs.update(local_entry["availableOrgans"])
        exported_ct_frames += local_entry["localFrameCount"]
        exported_overlay_stacks += len(local_entry["availableOrgans"])

    write_json(
        DATA_OUT / "pantsLocalAtlas.json",
        {
            "version": 3,
            "generatedAt": generated_at,
            "caseCount": len(local_cases),
            "cases": local_cases,
        },
    )

    global_manifest_path = CASES_ROOT / "manifest.json"
    if global_manifest_path.is_file():
        gm = json.loads(global_manifest_path.read_text(encoding="utf-8"))
        unique_from_export = gm.get("uniqueOrganLayers", sorted(unique_organs))
    else:
        unique_from_export = sorted(unique_organs)

    summary = build_summary(catalog_cases, local_ids, unique_from_export)
    summary["exportedCtFrames"] = exported_ct_frames
    summary["exportedOverlayStacks"] = exported_overlay_stacks
    write_json(DATA_OUT / "pantsAtlasSummary.json", summary)

    print(f"pantsCatalog.json       → {len(catalog_cases)} cases")
    print(f"pantsLocalAtlas.json    → {len(local_cases)} local volume cases")
    print(f"pantsAtlasSummary.json  → age buckets: {sum(summary['ageBucketCounts'].values())}")
    print(f"  nationality tokens: {len(summary['siteNationalityCounts'])}")
    print(f"  study years: {len(summary['studyYearCounts'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
