import { useMemo } from "react";
import { useDemoWorkspace } from "../../context/DemoWorkspaceContext";
import {
  METADATA_ONLY_NOTE,
  getAvailabilityBadge,
  getTumorBadge,
} from "../../data/pants-atlas";

export function CatalogMetadataDrawer() {
  const { metadataDrawerCaseId, closeMetadataDrawer, getCatalogCase } =
    useDemoWorkspace();

  const c = useMemo(
    () => (metadataDrawerCaseId ? getCatalogCase(metadataDrawerCaseId) : null),
    [metadataDrawerCaseId, getCatalogCase]
  );

  if (!metadataDrawerCaseId || !c) return null;

  const fields: Array<{ label: string; value: string | number | null }> = [
    { label: "Case ID", value: c.caseId },
    { label: "Sex", value: c.sex },
    { label: "Age", value: c.age },
    { label: "Tumor status", value: getTumorBadge(c) },
    { label: "Availability", value: getAvailabilityBadge(c) },
    { label: "Shape", value: c.shape },
    { label: "Spacing", value: c.spacing },
    { label: "CT phase", value: c.ctPhase },
    { label: "Manufacturer", value: c.manufacturer },
    { label: "Manufacturer model", value: c.manufacturerModel },
    { label: "Study type", value: c.studyType },
    { label: "Site", value: c.site },
    { label: "Site detail", value: c.siteDetail },
    { label: "Site nationality", value: c.siteNationality },
    { label: "Study year", value: c.studyYear != null ? String(c.studyYear) : null },
  ];

  return (
    <div className="catalog-drawer-backdrop" onClick={closeMetadataDrawer} role="presentation">
      <aside
        className="catalog-drawer"
        role="dialog"
        aria-labelledby="catalog-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="catalog-drawer-head">
          <div>
            <div className="meta-label">Metadata catalog</div>
            <h2 id="catalog-drawer-title">{c.caseId}</h2>
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={closeMetadataDrawer}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <dl className="catalog-drawer-dl">
          {fields.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value ?? "—"}</dd>
            </div>
          ))}
        </dl>

        <p className="catalog-drawer-note">{METADATA_ONLY_NOTE}</p>
      </aside>
    </div>
  );
}
