#!/usr/bin/env python3
"""Verify PanTS Atlas catalog JSON and exported PNG assets."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from pants_atlas_common import CASES_ROOT, DATABASE_ROOT, IMAGE_TR, REPO_ROOT, list_case_ids

DATA_DIR = REPO_ROOT / "assets" / "data"
CATALOG_PATH = DATA_DIR / "pantsCatalog.json"
SUMMARY_PATH = DATA_DIR / "pantsAtlasSummary.json"
METADATA_XLSX = REPO_ROOT / "PanTS-Viewer" / "PanTS" / "data" / "metadata.xlsx"

DB_PATH = DATABASE_ROOT / "pantsAtlasDatabase.json"
INDEX_PATH = DATABASE_ROOT / "caseIndex.json"
SCHEMA_PATH = DATABASE_ROOT / "organSchema.json"

AGE_BUCKETS = ("<20", "20s", "30s", "40s", "50s", "60s", "70s", "80+")
SEX_CANONICAL = {"M", "F", "Unknown"}


def _sex_has_duplicate_variants(sex_counts: dict) -> list[str]:
    issues: list[str] = []
    keys = set(sex_counts.keys())
    for raw in keys:
        stripped = raw.strip()
        if raw != stripped:
            issues.append(f"sexCounts key with whitespace: {raw!r}")
    if "M" in keys:
        dup_m = [k for k in keys if k.strip().upper() in ("M", "MALE") and k != "M"]
        if dup_m:
            issues.append(f"duplicate M variants in sexCounts: {dup_m}")
    if "F" in keys:
        dup_f = [k for k in keys if k.strip().upper() in ("F", "FEMALE") and k != "F"]
        if dup_f:
            issues.append(f"duplicate F variants in sexCounts: {dup_f}")
    return issues


def _check_png(rel: str, errors: list[str], label: str) -> None:
    if not rel:
        return
    p = REPO_ROOT / rel
    if not p.is_file():
        errors.append(f"Missing PNG: {label} → {rel}")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    info: list[str] = []

    for name, path in (
        ("caseIndex.json", INDEX_PATH),
        ("pantsAtlasDatabase.json", DB_PATH),
        ("organSchema.json", SCHEMA_PATH),
    ):
        if not path.is_file():
            errors.append(f"Missing assets/pants-atlas/database/{name}")

    if not CATALOG_PATH.is_file():
        errors.append("Missing assets/data/pantsCatalog.json — run build_pants_atlas_database.py")
        print("\n".join(errors))
        return 1

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    cases = catalog.get("cases", [])
    if len(cases) != 9901:
        errors.append(f"pantsCatalog.json must have 9901 cases, found {len(cases)}")

    local_folders = set(list_case_ids())
    catalog_local = {c["caseId"] for c in cases if c.get("hasLocalVolume")}

    if catalog_local != local_folders:
        missing_in_catalog = local_folders - catalog_local
        extra_in_catalog = catalog_local - local_folders
        if missing_in_catalog:
            errors.append(f"Local folders not marked hasLocalVolume: {sorted(missing_in_catalog)}")
        if extra_in_catalog:
            errors.append(f"hasLocalVolume true but no ImageTr folder: {sorted(extra_in_catalog)}")

    for case_id in local_folders:
        if not (IMAGE_TR / case_id).is_dir():
            errors.append(f"ImageTr folder missing for local case {case_id}")

    metadata_only_with_ct_paths = 0
    for c in cases:
        if c.get("hasLocalVolume"):
            continue
        case_id = c["caseId"]
        for suffix in ("ct.nii.gz", "ct.npz"):
            p = IMAGE_TR / case_id / suffix
            if p.is_file():
                errors.append(f"Metadata-only {case_id} must not have {suffix} in repo")
        if c.get("thumbnail") or c.get("ctPngFrames"):
            metadata_only_with_ct_paths += 1

    if metadata_only_with_ct_paths:
        errors.append(
            f"{metadata_only_with_ct_paths} metadata-only catalog rows incorrectly reference CT images"
        )

    # Legacy per-case manifest.json must not be required
    legacy_global = CASES_ROOT / "manifest.json"
    if legacy_global.is_file():
        warnings.append(
            "Legacy assets/pants-atlas/cases/manifest.json present — not used by runtime loader"
        )

    for case_id in local_folders:
        legacy = CASES_ROOT / case_id / "manifest.json"
        if legacy.is_file():
            warnings.append(
                f"Legacy per-case manifest (unused): {legacy.relative_to(REPO_ROOT)}"
            )

    db_cases: list[dict] = []
    if DB_PATH.is_file():
        db = json.loads(DB_PATH.read_text(encoding="utf-8"))
        db_cases = db.get("cases", [])
        if db.get("caseCount") != len(db_cases):
            errors.append("pantsAtlasDatabase.json caseCount mismatch")
        if len(db_cases) != len(local_folders):
            errors.append(
                f"pantsAtlasDatabase.json has {len(db_cases)} cases, expected {len(local_folders)} local"
            )

        for entry in db_cases:
            case_id = entry["caseId"]
            if case_id not in local_folders:
                errors.append(f"Database case {case_id} has no ImageTr folder")
                continue

            for rel in entry.get("ctFrames", []):
                _check_png(rel, errors, f"{case_id} CT")

            for organ, paths in entry.get("overlaysByOrgan", {}).items():
                for rel in paths:
                    _check_png(rel, errors, f"{case_id} overlay {organ}")

            thumb = entry.get("thumbnail")
            if thumb:
                _check_png(thumb, errors, f"{case_id} thumbnail")

            if entry.get("manifestPath"):
                errors.append(f"{case_id}: database must not use manifestPath")

            manifest_legacy = CASES_ROOT / case_id / "manifest.json"
            if manifest_legacy.is_file():
                pass  # allowed on disk but not loaded

        info.append(f"Atlas database cases: {len(db_cases)}")
        if db_cases:
            sample = db_cases[0]
            info.append(
                f"Sample CT frames: {len(sample.get('ctFrames', []))} · "
                f"overlays: {len(sample.get('overlaysByOrgan', {}))}"
            )

    if INDEX_PATH.is_file():
        index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        for row in index.get("cases", []):
            if row.get("manifestPath"):
                errors.append(
                    f"caseIndex.json must not reference manifestPath for {row.get('caseId')}"
                )

    summary: dict | None = None
    if SUMMARY_PATH.is_file():
        summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
        if summary.get("totalCatalogCases") != len(cases):
            errors.append("pantsAtlasSummary totalCatalogCases mismatch")
        if summary.get("localVolumeCases") != len(local_folders):
            errors.append("pantsAtlasSummary localVolumeCases mismatch")
        meta_only = sum(1 for c in cases if not c.get("hasLocalVolume"))
        if summary.get("metadataOnlyCases") != meta_only:
            errors.append("pantsAtlasSummary metadataOnlyCases mismatch")
        tumor_pos = sum(1 for c in cases if c.get("tumor") is True)
        if summary.get("tumorPositiveCases", summary.get("tumorCases")) != tumor_pos:
            errors.append("pantsAtlasSummary tumor count mismatch")

        age_buckets = summary.get("ageBucketCounts")
        if not age_buckets:
            errors.append("pantsAtlasSummary missing ageBucketCounts")
        else:
            age_total = sum(age_buckets.values())
            ages_in_catalog = sum(1 for c in cases if c.get("age") is not None)
            info.append(f"ageBucketCounts total: {age_total:,} (catalog with age: {ages_in_catalog:,})")

        nat_counts = summary.get("siteNationalityCounts")
        if not nat_counts:
            errors.append("pantsAtlasSummary missing or empty siteNationalityCounts")
        else:
            info.append(f"siteNationalityCounts categories: {len(nat_counts)}")

        sex_issues = _sex_has_duplicate_variants(summary.get("sexCounts", {}))
        for issue in sex_issues:
            errors.append(f"sexCounts normalization: {issue}")

        year_counts = summary.get("studyYearCounts")
        if not year_counts:
            warnings.append("studyYearCounts empty — check metadata study year column")
        else:
            info.append(f"studyYearCounts years: {len(year_counts)}")

        if METADATA_XLSX.is_file() and not nat_counts:
            errors.append(
                "metadata.xlsx exists but siteNationalityCounts is empty after build"
            )
    else:
        errors.append("Missing pantsAtlasSummary.json")

    src_png_count = sum(1 for _ in CASES_ROOT.rglob("*.png")) if CASES_ROOT.is_dir() else 0
    info.append(f"PNG files under cases/: {src_png_count}")

    print("PanTS Atlas audit (database-driven)")
    print("=" * 40)
    print(f"Catalog cases:     {len(cases):,}")
    print(f"Local volumes:     {len(local_folders)}")
    if summary:
        print(f"Summary version:   {summary.get('version')}")
    print(f"Errors:            {len(errors)}")
    print(f"Warnings:          {len(warnings)}")

    if info:
        print("\nAtlas / metadata:")
        for line in info:
            print(f"  · {line}")

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  - {w}")

    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
